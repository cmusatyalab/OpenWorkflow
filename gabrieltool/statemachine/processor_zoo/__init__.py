# -*- coding: utf-8 -*-
"""Callables that can process state machine inputs.
"""


def dummy(img, **kwargs):
    return {'dummy_key': 'dummy_value'}


def tpod_dnn(img, **kwargs):
    raise NotImplementedError()


def sandwitch_tpod_dnn(img, **kwargs):
    # TODO(junjuew): this is a hacky way to demonstrate
    # we can use state machine paradigm for sandwich
    # this is a copy of Zhuo's original sandwitch implementation
    import cooking_cv as cc
    import cv2
    import json
    resize_ratio = 1
    config = object()
    config.IMAGE_MAX_WH = 640
    if max(img.shape) > config.IMAGE_MAX_WH:
        resize_ratio = float(config.IMAGE_MAX_WH) / \
            max(img.shape[0], img.shape[1])
        img = cv2.resize(img, (0, 0), fx=resize_ratio,
                         fy=resize_ratio, interpolation=cv2.INTER_AREA)
    rtn_mesg, objects_data = cc.process(img, resize_ratio, [])
    objects = json.loads(objects_data)
    objects = reorder_objects(objects)
    return {'objects': objects}
