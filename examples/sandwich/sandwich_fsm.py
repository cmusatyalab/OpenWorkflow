# -*- coding: utf-8 -*-
"""Simple example of using gabrieltool.statemachine.
"""

from __future__ import absolute_import, division, print_function

import os
from functools import partial

from gabrieltool.statemachine import fsm, predicate_zoo, processor_zoo


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
                    partial_obj=partial(
                        predicate_zoo.always
                    )
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
                    partial_obj=partial(
                        predicate_zoo.has_obj_cls,
                        cls_name='bread'
                    )
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
                    partial_obj=partial(
                        predicate_zoo.has_obj_cls,
                        cls_name='ham'
                    )
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
                    partial_obj=partial(
                        predicate_zoo.has_obj_cls,
                        cls_name='lettuce'
                    )
                )
            ],
            instruction=fsm.Instruction(
                audio='Congratulations! You have finished!'
            ),
            next_state=st_end
        )
    )
    return st_start


if __name__ == "__main__":
    sandwich_fsm = build_sandwich_fsm()
    # save to disk
    with open('examples/sandwich/sandwich.pbfsm', 'wb') as f:
        f.write(fsm.StateMachine.to_bytes(
            name='sandwich',
            start_state=sandwich_fsm
        ))
