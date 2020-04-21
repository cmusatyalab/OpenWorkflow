# -*- coding: utf-8 -*-
"""Sandwich Cognitive Assistant."""

import os

from gabriel_server.local_engine import runner as gabriel_runner
from gabrieltool.statemachine import fsm, predicate_zoo, processor_zoo, runner
from logzero import logger


def _load_image_bytes(file_path):
    fileContent = None
    with open(file_path, mode='rb') as file:
        fileContent = file.read()
    return fileContent


def build_sandwich_fsm():
    data_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../../data/sandwich-model')
    img_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'images_feedback')

    labels = ["tomato", "cheese", "full", "ham", "lettuce", "cucumber", "half", "hamwrong", "bread"]
    proc = processor_zoo.FasterRCNNOpenCVCallable(
        proto_path=os.path.join(data_dir, 'faster_rcnn_test.pt'),
        model_path=os.path.join(data_dir, 'model.caffemodel'),
        labels=labels
    )

    common_processor = fsm.Processor(
        callable_obj=proc
    )

    st_start = fsm.State(
        name='start',
        processors=[common_processor]
    )
    st_bread = fsm.State(
        name='bread',
        processors=[common_processor]
    )
    st_ham = fsm.State(
        name='ham',
        processors=[common_processor]
    )
    st_lettuce = fsm.State(
        name='lettuce',
        processors=[common_processor]
    )
    st_end = fsm.State(
        name='end',
        processors=[common_processor]
    )

    # fill in transitions
    st_start.transitions.append(
        fsm.Transition(
            predicates=[
                fsm.TransitionPredicate(
                    callable_obj=predicate_zoo.Always()
                )
            ],
            instruction=fsm.Instruction(
                audio='Now put a piece of bread on the table.',
                image=_load_image_bytes(os.path.join(img_dir, 'bread.jpeg'))
            ),
            next_state=st_bread
        )
    )

    st_bread.transitions.append(
        fsm.Transition(
            predicates=[
                fsm.TransitionPredicate(
                    callable_obj=predicate_zoo.HasObjectClass(class_name='bread')
                )
            ],
            instruction=fsm.Instruction(
                audio='Now put a piece of ham on the bread.',
                image=_load_image_bytes(os.path.join(img_dir, 'ham.jpeg'))
            ),
            next_state=st_ham
        )
    )

    st_ham.transitions.append(
        fsm.Transition(
            predicates=[
                fsm.TransitionPredicate(
                    callable_obj=predicate_zoo.HasObjectClass(class_name='ham')
                )
            ],
            instruction=fsm.Instruction(
                audio='Now put a piece of lettuce on the ham.',
                image=_load_image_bytes(os.path.join(img_dir, 'lettuce.jpeg'))
            ),
            next_state=st_lettuce
        )
    )

    st_lettuce.transitions.append(
        fsm.Transition(
            predicates=[
                fsm.TransitionPredicate(
                    callable_obj=predicate_zoo.HasObjectClass(class_name='lettuce')
                )
            ],
            instruction=fsm.Instruction(
                audio='Congratulations! You have finished!'
            ),
            next_state=st_end
        )
    )
    return st_start


def run_gabriel_server():
    """Create and execute a gabriel server for helping making a toy sandwich."""
    logger.info('Building Sandwich FSM...')
    start_state = build_sandwich_fsm()
    logger.info('Initializing Cognitive Engine...')
    # engine_name has to be 'instruction' to work with
    # gabriel client from App Store. Someone working on Gabriel needs to fix this.
    engine_name = 'instruction'
    logger.info('Launching Gabriel server...')
    gabriel_runner.run(
        engine_setup=lambda: runner.BasicCognitiveEngineRunner(
            engine_name=engine_name, fsm=start_state),
        engine_name=engine_name,
        input_queue_maxsize=60,
        port=9099,
        num_tokens=1
    )


def generate_sandwich_fsm(output_path):
    """Create and save a FSM for sandwich assistant.

    Arguments:
        output_path {string} -- Path to save the FSM to.
    """
    start_state = build_sandwich_fsm()
    # save to disk
    with open(output_path, 'wb') as f:
        f.write(fsm.StateMachine.to_bytes(
            name='sandwich',
            start_state=start_state
        ))


if __name__ == "__main__":
    run_gabriel_server()
