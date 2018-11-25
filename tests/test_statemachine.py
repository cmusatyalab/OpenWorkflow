#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""Tests for `statemachine` subpackage."""

import functools
import os
import pickle

import pytest

from gabrieltool.statemachine import fsm, predicate_zoo, wca_state_machine_pb2


def test_statemachine_serialization(tmpdir):
    """Test state machine can be loaded correctly."""
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


def test_transitionpredicate():
    pred = fsm.TransitionPredicate(
        name='test_tp',
        partial_obj=functools.partial(
            predicate_zoo.has_obj_cls,
            cls_name='test_cls'))
    actual = pred.to_bytes()
    expected_pred = wca_state_machine_pb2.TransitionPredicate()
    expected_pred.name = 'test_tp'
    expected_pred.callable_name = 'has_obj_cls'
    expected_pred.callable_kwargs['cls_name'] = pickle.dumps('test_cls')
    expected = expected_pred.SerializeToString()
    assert actual == expected


# def test_statemachine_processor_call():
#     test = wca_state_machine_pb2.Processor()
#     test.name = 'test'
#     test.type = 'tpod_dnn'
#     test_p = fsm.Processor(test)
#     test_p(None)
