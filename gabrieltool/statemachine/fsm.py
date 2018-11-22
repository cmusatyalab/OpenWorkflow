# -*- coding: utf-8 -*-
"""Finite State Machine Representation

Each message type in the protobuf definition has a corresponding data class.
The data object is named as obj_<protobuf_msg_type>.
"""

from __future__ import absolute_import, division, print_function
from gabrieltool.statemachine import processor_zoo
from gabrieltool.statemachine import wca_state_machine_pb2


class FSMObjBase(object):
    """Adapter class.

    This adapter class exposes protobuf message attributes 
    as class attributes.
    """

    def __init__(self, protobuf_message):
        super(FSMObjBase, self).__init__()
        if protobuf_message is None:
            protobuf_message = getattr(wca_state_machine_pb2,
                                       self.__class__.__name__)()
        self._serializer = protobuf_message
        self._fsm = None

    def __repr__(self):
        default = super().__repr__()
        return '<{} ({})>'.format(self.name, default)

    @property
    def name(self):
        return self._serializer.name

    @name.setter
    def name(self, value):
        self._serializer.name = value

    @property
    def assets(self):
        if self._fsm is not None:
            return self._fsm.assets
        else:
            raise AttributeError(
                'Current Object {} does not have a pointer to '
                'FSM assets since it is not a part '
                'of a FSM yet.'.format(self))


class TriggerPredicate(FSMObjBase):
    """A TriggerPredicate is an callable object."""

    def __init__(self, tp_desc=None):
        super(TriggerPredicate, self).__init__(tp_desc)

    @property
    def type(self):
        return self._serializer.type

    @type.setter
    def type(self, value):
        self._serializer.type = value

    @property
    def kwargs(self):
        return self._serializer.kwargs

    def __call__(self, app_state):
        func = getattr(predicate_zoo, self.type)
        return func(app_state, **self.kwargs)


class Instruction(FSMObjBase):
    """Instruction to give to the user."""

    def __init__(self, inst_desc=None):
        super(Instruction, self).__init__(inst_desc)

    @property
    def audio(self):
        return self._serializer.audio

    @audio.setter
    def audio(self, value):
        self._serializer.audio = value

    @property
    def image(self):
        return self._serializer.image

    @image.setter
    def image(self, value):
        self._serializer.image = value

    @property
    def video(self):
        return self._serializer.video

    @video.setter
    def video(self, value):
        self._serializer.video = value


class Transition(FSMObjBase):
    """A Transition has satisfying predicates, next_state, and instructions."""

    def __init__(self, tran_desc=None):
        super(Transition, self).__init__(tran_desc)
        self.trigger_predicates = [TriggerPredicate(tp_desc) for
                                   tp_desc in self._serializer.trigger_predicates]

    def __call__(self, app_state):
        """Given the current app_state, check if a transition should be taken.

        The condition of taking a transition is that all the trigger predicates
        are satisfied. When all of them are satisfied, return True, next state,
        and instruction. Otherwise, return False, None, None.
        """
        for obj_trigger_predicate in self._obj_trigger_predicates:
            if not obj_trigger_predicate(app_state):
                return None
        return self

    @property
    def instruction(self):
        return self._serializer.instruction

    @property
    def next_state(self):
        try:
            next_state = self._fsm.get_state(self._serializer.next_state)
        except LookupError as e:
            next_state = None
        return next_state


class Processor(FSMObjBase):
    """A TriggerPredicate is an callable object."""

    def __init__(self, proc_desc=None):
        super(Processor, self).__init__(proc_desc)

    def __call__(self, img):
        func = getattr(processor_zoo, self.type)
        return func(img, **self.kwargs)

    @property
    def type(self):
        return self._serializer.type

    @type.setter
    def type(self, value):
        self._serializer.type = value

    @property
    def kwargs(self):
        return self._serializer.kwargs


class State(FSMObjBase):
    """A state has many processors and transitions.

    This class is used to represent all the actions/code that can be called for
    a state.
    """
    # TODO(junjuew): enforce state names need to be unique at creation

    def __init__(self, state_desc=None):
        super(State, self).__init__(state_desc)
        self._obj_processors = [Processor(proc_desc) for
                                proc_desc in self.processors]
        self._obj_transitions = [Transition(tran_desc) for
                                 tran_desc in self.transitions]

    def _run_processors(self, img):
        app_state = {'raw': img}
        for obj_processor in self._obj_processors:
            app_state.extend(obj_processor(img))
        return app_state

    def _get_one_satisfied_transition(self, app_state):
        for obj_transition in self._obj_transitions:
            if obj_transition(app_state) is not None:
                return obj_transition
        return None

    # TODO (junjuew): fill this in
    def __call__(self, img):
        """React to the image.

        Within each state, the processors should first run based on their order
        to get application state.
        Then, the triggerPredicates should be run.

        Arguments:
            img {np array} -- input image

        Returns:
            next state {State}
        """
        app_state = self._run_processor(img, self._current_state.processors)
        transition = self._get_one_satisfied_transition(img, app_state)
        if transition is None:
            return self, None
        else:
            return transition.next_state, transition.instruction


class StateMachine(FSMObjBase):
    """State Machine contains a list of states and transitions.
    """

    def __init__(self, fsm_desc=None):
        super(StateMachine, self).__init__(fsm_desc)
        if len(self.states) == 0:
            raise ValueError(
                "FSM {} does not have any states!".format(self.name))
        self._obj_states_lut = {}
        for state_desc in self.states:
            if state_desc.name in self._obj_states_lut:
                raise ValueError(
                    "Invalid FSM. Duplicate State Names {} Found.".format(
                        state_desc.name))
            else:
                self._obj_states_lut[state_desc.name] = State(state_desc)
        self._current_state = self._obj_states_lut[self.start_state]

    @property
    def current_state(self):
        return self._current_state

    def get_state(self, state_name):
        return self._obj_states_lut[state_name]
