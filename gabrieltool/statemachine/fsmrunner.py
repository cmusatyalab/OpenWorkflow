# -*- coding: utf-8 -*-
"""Finite State Machine Runner.

This is a fsm runner to run cognitive assistance that are
expressed as state machines.
"""

from __future__ import absolute_import, division, print_function
from gabrieltool.statemachine import processor


class ProtobufFieldAdapter(object):
    """Adapter class.

    This adapter class exposes protobuf message attributes 
    as class attributes.
    """

    def __init__(self, protobuf_message):
        super(ProtobufFieldAdapter, self).__init__()
        self.__dict__.update(protobuf_message.__dict__)


class TriggerPredicate(ProtobufFieldAdapter):
    """A TriggerPredicate is an callable object."""

    def __init__(self, tp_desc):
        super(TriggerPredicate, self).__init__()

    def __call__(self, *args, **kwargs):
        # TODO(junjuew): call functions based on type and kwargs
        pass


class Transition(ProtobufFieldAdapter):
    """A Transition has satisfying predicates, next_state, and instructions."""

    def __init__(self, tran_desc):
        super(Transition, self).__init__()
        self.trigger_predicates = [TriggerPredicate(tp_desc)
                                   for tp_desc in self.trigger_predicates]


class State(ProtobufFieldAdapter):
    """A state has many processors and transitions.

    This class is used to represent all the actions/code that can be called for
    a state.
    """

    def __init__(self, state_desc):
        super(State, self).__init__()
        # massage processor and transition descriptions into objects
        self.processors = [Processor(proc_desc) for
                           proc_desc in self.processors]
        self.transitions = [Transition(tran_desc) for
                            tran_desc in self.transitions]


class StateMachine(ProtobufFieldAdapter):
    """State Machine contains a list of states and transitions.
    """

    def __init__(self, fsm_desc):
        super(StateMachine, self).__init__()
        # massage each serialized state description into objects
        # we can work with
        self.states = [State(state_desc) for state_desc in self.states]


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

        Within each state, the processors should first run based on their order
        to get application state.
        Then, the triggerPredicates should be run.
        """
        app_state = self._run_processor(img, self._current_state.processors)
        transition = self._get_satisfied_transition(img, app_state)
        self._move(transition)

    def _run_processor(self, img, procs_desc):
        app_state = {}
        proc_funcs = [self._get_processor(proc_desc)
                      for proc_desc in procs_desc]
        for proc_func in proc_funcs:
            app_state.extend(proc_func(img))
        return app_state

    def _get_processor(self, proc_desc):
        return processor[proc_desc.type]

    def _get_satisfied_transition(self, input, app_state):
        pass

    def _move(transition):
        pass
