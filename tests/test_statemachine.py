#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""Tests for `statemachine` subpackage."""

import functools
import os
import pickle

import pytest

from gabrieltool.statemachine import fsm, wca_state_machine_pb2
from gabrieltool.statemachine import processor_zoo, predicate_zoo


def test_protobuf_serialization(tmpdir):
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


def test_transition_predicate_serialization():
    pred = fsm.TransitionPredicate(
        name='test_tp',
        partial_obj=functools.partial(
            predicate_zoo.has_obj_cls,
            cls_name='test_cls'))
    actual = pred.to_desc().SerializeToString()
    expected_pred = wca_state_machine_pb2.TransitionPredicate()
    expected_pred.name = 'test_tp'
    expected_pred.callable_name = 'has_obj_cls'
    expected_pred.callable_kwargs['cls_name'] = pickle.dumps('test_cls')
    expected = expected_pred.SerializeToString()
    assert actual == expected


def test_instruction_serialization():
    inst = fsm.Instruction(
        name='test_inst',
        audio='test_audio',
        image='test_image'.encode('utf-8'),
        video='test_video'.encode('utf-8')
    )
    actual = inst.to_desc().SerializeToString()
    expected_inst = wca_state_machine_pb2.Instruction()
    expected_inst.name = 'test_inst'
    expected_inst.audio = 'test_audio'
    expected_inst.image = 'test_image'.encode('utf-8')
    expected_inst.video = 'test_video'.encode('utf-8')
    expected = expected_inst.SerializeToString()
    assert actual == expected


def test_instruction_serialization():
    tran = fsm.Transition(
        name='test_tran'
    )
    pred = fsm.TransitionPredicate(
        name='test_tp',
        partial_obj=functools.partial(
            predicate_zoo.has_obj_cls,
            cls_name='test_cls'))
    inst = fsm.Instruction(
        name='test_inst',
        audio='test_audio',
        image='test_image'.encode('utf-8'),
        video='test_video'.encode('utf-8')
    )
    tran.predicates.append(pred)
    tran.instruction = inst
    tran.next_state = fsm.State(name='test_next_state')
    actual = tran.to_desc().SerializeToString()
    expected_obj = wca_state_machine_pb2.Transition(
        name='test_tran',
        predicates=[wca_state_machine_pb2.TransitionPredicate(
            name='test_tp',
            callable_name='has_obj_cls',
            callable_kwargs={'cls_name': pickle.dumps('test_cls')}
        )],
        instruction=wca_state_machine_pb2.Instruction(
            name='test_inst',
            audio='test_audio',
            image='test_image'.encode('utf-8'),
            video='test_video'.encode('utf-8')
        ),
        next_state='test_next_state'
    )
    expected = expected_obj.SerializeToString()
    assert actual == expected


def test_processor_serialization():
    obj = fsm.Processor(
        name='test_proc',
        partial_obj=functools.partial(
            processor_zoo.dummy,
            dummy_input='dummy_input_value'))
    actual = obj.to_desc().SerializeToString()
    expected_obj = wca_state_machine_pb2.Processor()
    expected_obj.name = 'test_proc'
    expected_obj.callable_name = 'dummy'
    expected_obj.callable_kwargs['dummy_input'] = pickle.dumps(
        'dummy_input_value')
    expected = expected_obj.SerializeToString()
    assert actual == expected
