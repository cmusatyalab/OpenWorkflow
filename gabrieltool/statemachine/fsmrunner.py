# -*- coding: utf-8 -*-
"""Finite State Machine Runner.

This is a fsm runner to run cognitive assistance that are
expressed as state machines. 
"""

from __future__ import absolute_import, division, print_function


class Runner(object):
    """Finite State Machine Runner."""

    def __init__(self, fsm):
        super(Runner, self).__init__()
        self._fsm = fsm
        self._current_state = self._fsm.current_state

    def feed(self, img):
        """Run the state machine given an input.

        """
        next_state_name, instruction = self._current_state(img)
        self._current_state = self._fsm.get_state(next_state_name)
        return instruction
