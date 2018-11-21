#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""Tests for `statemachine` subpackage."""

import os

import pytest
from gabrieltool.statemachine import fsmrunner


def test_statemachine_serialization(tmpdir):
    """Test state machine can be loaded correctly."""
    from gabrieltool.statemachine import wca_state_machine_pb2
    test_fsm = wca_state_machine_pb2.StateMachine()
    state = test_fsm.states.add()
    state.name = 'start'
    fsm_path = os.path.join(tmpdir, 'test.fsm')
    with open(fsm_path, 'wb') as f:
        f.write(test_fsm.SerializeToString())
    fsm_read = wca_state_machine_pb2.StateMachine()
    with open(fsm_path, 'rb') as f:
        fsm_read.ParseFromString(f.read())
    assert fsm_read.states[0].name == state.name


def test_statemachine_processor_call():
    test = wca_state_machine_pb2.Processor()
    test.name = 'test'
    test.type = 'tpod_dnn'
    test_p = Processor(test)
    test_p(None)
