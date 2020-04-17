# -*- coding: utf-8 -*-
"""Example of using gabrieltool.statemachine for using TF models for analysis.

The TF models can be exported from OpenTPOD or any TF SavedModel that can be
served by TF-Serving.

An example model (SSD-MobilenetV2) can be downloaded from 
http://download.tensorflow.org/models/object_detection/ssd_mobilenet_v2_coco_2018_03_29.tar.gz
After downloading and unzipping the tar ball, rearrange the saved_model
directory in the original package into the following structure by renaming and 
making a version directory (00001).
The labels for COCO dataset can be found at 
https://github.com/tensorflow/models/blob/master/research/object_detection/data/mscoco_label_map.pbtxt

.
├── ssd_mobilenet_v2_saved_model
│   └── 00001
│       ├── saved_model.pb
│       └── variables
└── tf-serving-example.py

In this example, we create a naive 2-state FSM that detects the presence of a person.
"""

from __future__ import absolute_import, division, print_function

from functools import partial

import cv2
from logzero import logger

from gabrieltool.statemachine import fsm, predicate_zoo, processor_zoo, runner


def build_fsm():
    # create a three state state machine
    st_start = fsm.State(
        name='start',
        processors=[],
        transitions=[
            fsm.Transition(
                name='tran_start_to_proc',
                predicates=[
                    fsm.TransitionPredicate(
                        partial_obj=partial(
                            predicate_zoo.always
                        )
                    )
                ],
                instruction=fsm.Instruction(audio='Looking for person...')
            )
        ]
    )
    st_tf = fsm.State(
        name='tf_serving',
        processors=[fsm.Processor(
            name='proc_start',
            callable_obj=processor_zoo.TFServingContainerCallable('ssd_mobilenet_v2',
                                                                  'examples/ssd_mobilenet_v2_saved_model',
                                                                  conf_threshold=0.8
                                                                  )
        )],
        transitions=[
            fsm.Transition(
                name='tran_tf_to_end',
                predicates=[
                    fsm.TransitionPredicate(
                        partial_obj=partial(
                            predicate_zoo.has_obj_cls,
                            cls_name='1'  # 1 is Person
                        )
                    )
                ],
                instruction=fsm.Instruction(audio='Found a person!')
            )
        ]
    )

    # transitions are created after the state objects
    st_start.transitions[0].next_state = st_tf
    st_tf.transitions[0].next_state = st_tf
    return st_start


def save_model(start_state):
    # save to disk
    with open('examples/tf-serving-example.pbfsm', 'wb') as f:
        f.write(fsm.StateMachine.to_bytes(
            name='tf_serving_example',
            start_state=start_state
        ))


def run_model(start_state, video_uri=0):
    fsm_runner = runner.Runner(start_state)
    cam = cv2.VideoCapture(video_uri)
    while True:
        _, image = cam.read()
        inst = fsm_runner.feed(image)
        if inst is not None:
            logger.info('instruction text: {}'.format(inst.audio))
            cv2.putText(image, inst.audio, (100, 100),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
        cv2.imshow('input', image)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    cam.release()
    cv2.destroyAllWindows()


if __name__ == '__main__':
    start_state = build_fsm()
    # save_model(start_state)
    run_model(start_state)
