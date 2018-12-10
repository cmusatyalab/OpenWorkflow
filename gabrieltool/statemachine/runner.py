# -*- coding: utf-8 -*-
"""Finite State Machine Runner.

This is a fsm runner to run cognitive assistance that are
expressed as state machines. 
"""

from __future__ import absolute_import, division, print_function
from logzero import logger
from gabrieltool.statemachine import fsm
from gabrieltool.statemachine import processor_zoo


class Runner(object):
    """Finite State Machine Runner."""

    def __init__(self, start_state):
        super(Runner, self).__init__()
        self.current_state = start_state

    def feed(self, img):
        """Run the state machine given an input.

        """
        next_state, instruction = self.current_state(img)
        self.current_state = next_state
        return instruction

    def __enter__(self):
        # initialize all processors that need initial state
        logger.debug("initializing Runner context by running initialization of processors...")
        for state in fsm.StateMachine.bfs(self.current_state):
            for proc in state.processors:
                if isinstance(proc, processor_zoo.StatefulProcessor):
                    proc.init()
        logger.debug("Runner context initialized")

    def __exit__(self, exc_type, exc_value, exc_traceback):
        logger.debug("shutting down Runner context...")
        for state in fsm.StateMachine.bfs(self.current_state):
            for proc in state.processors:
                if isinstance(proc, processor_zoo.StatefulProcessor):
                    proc.clean()
        logger.debug("Runner context shut down")
