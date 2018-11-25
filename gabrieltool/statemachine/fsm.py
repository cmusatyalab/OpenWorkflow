# -*- coding: utf-8 -*-
"""Finite State Machine Representation

Each message type in the protobuf definition has a corresponding data class.
The data object is named as obj_<protobuf_msg_type>.
"""

from __future__ import absolute_import, division, print_function
import functools
import pickle
from gabrieltool.statemachine import processor_zoo
from gabrieltool.statemachine import predicate_zoo
from gabrieltool.statemachine import wca_state_machine_pb2
from gabrieltool.statemachine.wca_state_machine_pb2 import Instruction


class FSMObjBase(object):
    """Adapter class to translate protobuf's serialized class.

    This adapter class exposes protobuf message attributes
    as class attributes.
    """
    _obj_cnt = 0

    def __init__(self, name=None):
        """Base Initializer

        Arguments:
            parent {FSMObjBase Children Classes} -- Pointer to the parent element.
            protobuf_message {ProtoBuf Class} -- Serialized description of the element.
        """

        super(FSMObjBase, self).__init__()
        FSMObjBase._obj_cnt += 1
        protobuf_message = getattr(wca_state_machine_pb2,
                                   self.__class__.__name__)()
        self._pb = protobuf_message
        self._expose_serializer_attr('name', 'rw')
        self.name = self._get_default_name()
        if name is None:
            self.name = name

    def _get_default_name(self):
        return '{}_{}'.format(self.__class__.name, FSMObjBase._obj_cnt)

    def __repr__(self):
        default = super().__repr__()
        return '<{} ({})>'.format(self.name, default)

    def _expose_serializer_attr(self, name, mode):
        """Helper method to provide easy access to serializer attribute."""
        if mode == 'r':
            setattr(FSMObjBase, name, property(
                lambda self: getattr(self._pb, name)))
        elif mode == 'rw':
            setattr(FSMObjBase,
                    name,
                    property(lambda self: getattr(self._pb, name),
                             lambda self, value: setattr(
                                 self._pb, name, value)
                             ))
        else:
            raise ValueError(
                'Unsupported mode {}. Valid modes are "r" or "rw"'.format(mode))

    def from_bytes(self, data):
        protobuf_message = getattr(wca_state_machine_pb2,
                                   self.__class__.__name__)()
        protobuf_message.ParseFromString(data)
        self._pb = protobuf_message

    def to_bytes(self):
        return self._pb.SerializeToString()


class TransitionPredicate(FSMObjBase):
    """A TriggerPredicate is an callable object."""

    def __init__(self, name=None, partial_obj=None):
        """TransitionPredicate callable object

        Keyword Arguments:
            name {[type]} -- [description] (default: {None})
            func {partial object} -- Partial Function Object (default: {None})
        """

        super(TransitionPredicate, self).__init__(name)
        self.partial_obj = partial_obj

    def __call__(self, app_state):
        return self.partial_obj(app_state=app_state)

    def from_bytes(self, data):
        super().from_bytes(data)
        func = getattr(predicate_zoo, self._pb.callable_name)
        self.partial_obj = functools.partial(func, self._pb.callable_kwargs)

    def to_bytes(self):
        self._pb.callable_name = self.partial_obj.func.__name__
        for (item, value) in self.partial_obj.keywords.items():
            self._pb.callable_kwargs[item] = pickle.dumps(value)
        return super().to_bytes()


class Transition(FSMObjBase):
    """A Transition has satisfying predicates, next_state, and instructions."""

    def __init__(self, name=None, predicates=None, instruction=None, next_state_name=None):
        super(Transition, self).__init__(name)
        expose_attrs = [('instruction', 'r')]
        for (attr, mode) in expose_attrs:
            self._expose_serializer_attr(attr, mode)
        self.predicates = predicates if predicates is not None else []
        if instruction is not None:
            self.instruction.CopyFrom(instruction)
        self.next_state_name = next_state_name

    def __call__(self, app_state):
        """Given the current app_state, check if a transition should be taken.

        The condition of taking a transition is that all the trigger predicates
        are satisfied. When all of them are satisfied, return True, next state,
        and instruction. Otherwise, return False, None, None.
        """
        for predicate in self.predicates:
            if not predicate(app_state):
                return None
        return self


class Processor(FSMObjBase):
    """A TriggerPredicate is an callable object."""

    def __init__(self, name=None, partial_obj=None):
        super(Processor, self).__init__(name)
        self.partial_obj = partial_obj

    def __call__(self, img):
        return self.partial_obj(img)


class State(FSMObjBase):
    """A state has many processors and transitions.

    This class is used to represent all the actions/code that can be called for
    a state.
    """
    # TODO(junjuew): enforce state names need to be unique at creation

    def __init__(self, name=None, processors=None, transitions=None):
        super(State, self).__init__(name)
        self.processors = processors if processors is not None else []
        self.transitions = transitions if transitions is not None else []

    def _run_processors(self, img):
        app_state = {'raw': img}
        for obj_processor in self.processors:
            app_state.extend(obj_processor(img))
        return app_state

    def _get_one_satisfied_transition(self, app_state):
        for obj_transition in self.transitions:
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
        app_state = self._run_processor(img, self.processors)
        transition = self._get_one_satisfied_transition(img, app_state)
        if transition is None:
            return self, None
        else:
            return transition.next_state, transition.instruction


class StateMachine(FSMObjBase):
    """State Machine contains a list of states and transitions.
    """

    def __init__(self, name=None, states=None, start_state=None):
        super(StateMachine, self).__init__(name)
        expose_attrs = [('assets', 'r')]
        for (attr, mode) in expose_attrs:
            self._expose_serializer_attr(attr, mode)
        self.states = states if states is not None else []
        self.start_state = start_state

    # TODO(junjuew): implement from_bytes and to_bytes

    # def from_bytes(self, data):
    #    if len(self.states) == 0:
    #         raise ValueError(
    #             "FSM {} does not have any states!".format(self.name))
    #     self._states_lut = {}
    #     for state_desc in self._pb.states:
    #         if state_desc.name in self._states_lut:
    #             raise ValueError(
    #                 "Invalid FSM. Duplicate State Names {} Found.".format(
    #                     state_desc.name))
    #         else:
    #             self._states_lut[state_desc.name] = State(desc=state_desc)
    #     self._current_state = self._states_lut[self.start_state]

    @property
    def current_state(self):
        return self._current_state

    @property
    def start_state(self):
        try:
            return self._states_lut[self._pb.start_state]
        except LookupError:
            return None

    @start_state.setter
    def start_state(self, value):
        if type(value) != State:
            raise TypeError("{} is not a state object".format(value))
        else:
            self.start_state = value
            self._pb.start_state = self.start_state.name

    def get_state(self, state_name):
        return self._states_lut[state_name]
