# -*- coding: utf-8 -*-
"""Application-dependent Custom Processors.

This module is here mainly for porting existing gabriel
applications to the state machine paradigm.
"""


def reorder_objects(result):
    """copyied from Zhuo's implementation."""
    # build a mapping between faster-rcnn recognized object order to a standard
    # order
    config = object()
    config.LABELS = ["bread", "ham", "cucumber", "lettuce", "cheese", "half", "hamwrong", "tomato", "full"]
    object_mapping = [-1] * len(config.LABELS)
    with open("model/labels.txt") as f:
        lines = f.readlines()
        for idx, line in enumerate(lines):
            line = line.strip()
            object_mapping[idx] = config.LABELS.index(line)

    for i in xrange(result.shape[0]):
        result[i, -1] = object_mapping[int(result[i, -1] + 0.1)]

    return result


def sandwitch_tpod_dnn(img, **kwargs):
    """adapted from Zhuo's implementation."""
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
        resize_ratio = float(
            config.IMAGE_MAX_WH) / max(img.shape[0], img.shape[1])
        img = cv2.resize(img, (0, 0), fx=resize_ratio,
                         fy=resize_ratio, interpolation=cv2.INTER_AREA)
    rtn_mesg, objects_data = cc.process(img, resize_ratio, [])
    objects = json.loads(objects_data)
    objects = reorder_objects(objects)

    app_state = {}
    if len(objects.shape) < 2:  # nothing detected
        return app_state

    config.LABELS = ["bread", "ham", "cucumber", "lettuce", "cheese", "half", "hamwrong", "tomato", "full"]
    # get the count of detected objects
    object_counts = []
    for i in xrange(len(config.LABELS)):
        object_counts.append(sum(objects[:, -1] == i))

    for (idx, object_count) in enumerate(object_counts):
        app_state[config.LABELS[idx]] = object_count
    return app_state
