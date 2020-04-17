# -*- coding: utf-8 -*-
"""Finite State Machine Runner.

This is a fsm runner to run cognitive assistance that are
expressed as state machines. 
"""


from logzero import logger
from gabrieltool.statemachine import fsm
from gabrieltool.statemachine import processor_zoo


class Runner(object):
    """Finite State Machine Runner.

    Make sure the fsm is constructed fully before creating a runner.
    """

    def __init__(self, start_state, prepare_to_run=True):
        super(Runner, self).__init__()
        self.current_state = start_state
        if prepare_to_run:
            self.prepare_to_run()

    def feed(self, img, debug=False):
        """Run the state machine given an input.

        """
        if self.current_state is None:
            raise ValueError('Current State is None! Did you forget to specify transition\'s next_state?')
        next_state, instruction = self.current_state(img)
        self.current_state = next_state
        return instruction

    def prepare_to_run(self):
        """Prepare each state in the state machine to run.

        This allows each state to load asset from disks, start container, etc.
        Each state's behavior should be implemented in their prepare function.
        """
        for state in fsm.StateMachine.bfs(self.current_state):
            state.prepare()
