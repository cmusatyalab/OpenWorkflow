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
    fsm_path = os.path.join(tmpdir.strpath, 'test.fsm')
    with open(fsm_path, 'wb') as f:
        f.write(test_fsm.SerializeToString())
    fsm_read = wca_state_machine_pb2.StateMachine()
    with open(fsm_path, 'rb') as f:
        fsm_read.ParseFromString(f.read())
    assert fsm_read.states[0].name == state.name


@pytest.fixture
def transition_predicate_obj():
    return fsm.TransitionPredicate(
        name='test_tp',
        partial_obj=functools.partial(
            predicate_zoo.has_obj_cls,
            cls_name='test_cls'))


@pytest.fixture
def expected_transition_predicate_obj():
    expected_pred = wca_state_machine_pb2.TransitionPredicate()
    expected_pred.name = 'test_tp'
    expected_pred.callable_name = 'has_obj_cls'
    expected_pred.callable_kwargs['cls_name'] = pickle.dumps('test_cls')
    return expected_pred


@pytest.fixture
def instruction_obj():
    return fsm.Instruction(
        name='test_inst',
        audio='test_audio',
        image='test_image'.encode('utf-8'),
        video='test_video'.encode('utf-8')
    )


@pytest.fixture
def expected_instruction_obj():
    expected_inst = wca_state_machine_pb2.Instruction()
    expected_inst.name = 'test_inst'
    expected_inst.audio = 'test_audio'
    expected_inst.image = 'test_image'.encode('utf-8')
    expected_inst.video = 'test_video'.encode('utf-8')
    return expected_inst


@pytest.fixture
def processor_obj():
    return fsm.Processor(
        name='test_proc',
        partial_obj=functools.partial(
            processor_zoo.dummy,
            dummy_input='dummy_input_value'))


@pytest.fixture
def expected_processor_obj():
    expected_obj = wca_state_machine_pb2.Processor()
    expected_obj.name = 'test_proc'
    expected_obj.callable_name = 'dummy'
    expected_obj.callable_kwargs['dummy_input'] = pickle.dumps(
        'dummy_input_value')
    return expected_obj


@pytest.fixture
def transition_obj(transition_predicate_obj, instruction_obj):
    tran = fsm.Transition(
        name='test_tran'
    )
    tran.predicates.append(transition_predicate_obj)
    tran.instruction = instruction_obj
    tran.next_state = fsm.State(name='test_next_state')
    return tran


@pytest.fixture
def expected_transition_obj():
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
    return expected_obj


@pytest.fixture
def state_obj(processor_obj, transition_obj):
    return fsm.State(
        name='test_state',
        processors=[processor_obj],
        transitions=[transition_obj]
    )


@pytest.fixture
def expected_state_obj(expected_processor_obj, expected_transition_obj):
    return wca_state_machine_pb2.State(
        name='test_state',
        processors=[expected_processor_obj],
        transitions=[expected_transition_obj]
    )


def test_transition_predicate_serialization(transition_predicate_obj,
                                            expected_transition_predicate_obj):
    assert transition_predicate_obj.to_desc().SerializeToString(
    ) == expected_transition_predicate_obj.SerializeToString()


def test_instruction_serialization(instruction_obj,
                                   expected_instruction_obj):
    assert instruction_obj.to_desc().SerializeToString(
    ) == expected_instruction_obj.SerializeToString()


def test_transition_serialization(transition_obj,
                                  expected_transition_obj):
    assert transition_obj.to_desc().SerializeToString(
    ) == expected_transition_obj.SerializeToString()


def test_processor_serialization(processor_obj,
                                 expected_processor_obj):
    assert processor_obj.to_desc().SerializeToString(
    ) == expected_processor_obj.SerializeToString()


def test_state_machine_serialization_one_state(state_obj, expected_state_obj):
    actual = fsm.StateMachine.to_bytes(name='test_fsm', start_state=state_obj)
    expected_obj = wca_state_machine_pb2.StateMachine()
    expected_obj.name = 'test_fsm'
    expected_obj.states.extend([expected_state_obj,
                                wca_state_machine_pb2.State(
                                    name='test_next_state'
                                )])
    expected_obj.start_state = 'test_state'
    # state may be indifferent order
    expected_obj2 = wca_state_machine_pb2.StateMachine()
    expected_obj2.name = 'test_fsm'
    expected_obj2.states.extend([
        wca_state_machine_pb2.State(
            name='test_next_state'
        ),
        expected_state_obj,
    ])
    expected_obj2.start_state = 'test_state'
    assert (actual == expected_obj.SerializeToString() or actual == expected_obj2.SerializeToString())


def assert_processor_or_predicate_content_equal(actual, expected):
    assert actual.name == expected.name
    assert actual.partial_obj.func == expected.partial_obj.func
    assert actual.partial_obj.args == expected.partial_obj.args
    assert actual.partial_obj.keywords == expected.partial_obj.keywords


def assert_transition_content_equal(actual, expected):
    assert actual.name == expected.name
    instruction_attrs = ('name', 'audio', 'image', 'video')
    for instruction_attr in instruction_attrs:
        assert getattr(actual.instruction, instruction_attr) == getattr(
            expected.instruction, instruction_attr)
    assert_state_content_equal(actual.next_state, expected.next_state)
    for (idx, actual_pred) in enumerate(actual.predicates):
        expected_pred = expected.predicates[idx]
        assert_processor_or_predicate_content_equal(
            actual_pred, expected_pred)


def assert_state_content_equal(actual, expected):
    assert actual.name == expected.name
    # compare processors
    for (idx, actual_proc) in enumerate(actual.processors):
        expected_proc = expected.processors[idx]
        assert_processor_or_predicate_content_equal(actual_proc, expected_proc)
    # compare transitions
    for (idx, actual_tran) in enumerate(actual.transitions):
        expected_tran = expected.transitions[idx]
        assert_transition_content_equal(actual_tran, expected_tran)


def test_state_machine_deserialization_one_state(state_obj):
    fsm_data = fsm.StateMachine.to_bytes(
        name='test_fsm', start_state=state_obj)
    actual_state = fsm.StateMachine.from_bytes(fsm_data)
    expected_state = state_obj
    assert_state_content_equal(actual_state, expected_state)
