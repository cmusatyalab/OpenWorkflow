# -*- coding: utf-8 -*-
"""Finite State Machine Runner.

This is a fsm runner to run cognitive assistance that are
expressed as state machines.
"""

from __future__ import absolute_import, division, print_function
from gabrieltool.statemachine import processor_zoo
import wca_state_machine_pb2


class ProtobufFieldAdapter(object):
    """Adapter class.

    This adapter class exposes protobuf message attributes 
    as class attributes.
    """

    def __init__(self, protobuf_message):
        super(ProtobufFieldAdapter, self).__init__()
        if protobuf_message is None:
            protobuf_message = getattr(wca_state_machine_pb2,
                                       self.__class__.__name__)()
        self._pb = protobuf_message

    def __getattr__(self, name):
        if '_pb' in self.__dict__:
            return getattr(self.__dict__['_pb'], name)
        else:
            raise AttributeError('Class {} does not have attribute {}'.format(
                self.__class__.__name__, name))

    def __setattr__(self, name, value):
        if '_pb' in self.__dict__ and hasattr(self.__dict__['_pb'], name):
            setattr(self._pb, name, value)
        object.__setattr__(self, name, value)


class TriggerPredicate(ProtobufFieldAdapter):
    """A TriggerPredicate is an callable object."""

    def __init__(self, tp_desc=None):
        super(TriggerPredicate, self).__init__(tp_desc)

    def __call__(self, app_state):
        func = getattr(predicate_zoo, self.type)
        return func(app_state, **self.kwargs)


class Processor(ProtobufFieldAdapter):
    """A TriggerPredicate is an callable object."""

    def __init__(self, proc_desc=None):
        super(Processor, self).__init__(proc_desc)

    def __call__(self, img):
        func = getattr(processor_zoo, self.type)
        return func(img, **self.kwargs)


class Transition(ProtobufFieldAdapter):
    """A Transition has satisfying predicates, next_state, and instructions."""

    def __init__(self, tran_desc=None):
        super(Transition, self).__init__(tran_desc)


class State(ProtobufFieldAdapter):
    """A state has many processors and transitions.

    This class is used to represent all the actions/code that can be called for
    a state.
    """

    def __init__(self, state_desc=None):
        super(State, self).__init__(state_desc)

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
        transition = self._get_satisfied_transition(img, app_state)
        self._move(transition)


class StateMachine(ProtobufFieldAdapter):
    """State Machine contains a list of states and transitions.
    """

    def __init__(self, fsm_desc=None):
        super(StateMachine, self).__init__(fsm_desc)


class Runner(object):
    """Finite State Machine Runner."""

    def __init__(self, fsm):
        super(Runner, self).__init__()
        self._fsm = fsm
        if len(self._fsm.states) == 0:
            raise ValueError("FSM {} does not have any states!".format(self._fsm.name))
        self._current_state = self._fsm.states[0]

    def feed(self, img):
        """Run the state machine given an input.

        """
        next_state = self._current_state(img)
        self._current_state = next_state
