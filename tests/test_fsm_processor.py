
# -*- coding: utf-8 -*-

"""Tests for `statemachine` processors."""

import functools
import os
import pickle

import pytest

from gabrieltool.statemachine import processor_zoo
import cv2


def drawPred(frame, class_name, conf, left, top, right, bottom):
    # Draw a bounding box.
    cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0))

    label = '%.2f' % conf

    label = '%s: %s' % (class_name, label)

    labelSize, baseLine = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
    top = max(top, labelSize[1])
    cv2.rectangle(frame, (left, top - labelSize[1]), (left + labelSize[0], top + baseLine), (255, 255, 255), cv2.FILLED)
    cv2.putText(frame, label, (left, top), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0))
    return frame


def test_FasterRCNNOpenCVProcessor():
    """Test FasterRCNNOpenCV Processor.

    Needs the data directory.
    """
    data_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../data/sandwich-model')
    labels = ["tomato", "cheese", "full", "ham", "lettuce", "cucumber", "half", "hamwrong", "bread"]
    if os.path.exists(data_dir) and os.path.isdir(data_dir):
        proc = processor_zoo.FasterRCNNOpenCVProcessor(
            proto_path=os.path.join(data_dir, 'faster_rcnn_test.pt'),
            model_path=os.path.join(data_dir, 'model.caffemodel'),
            labels=labels,
        )
        im = cv2.imread(os.path.join(data_dir, 'test.jpg'))
        preds = proc(im)
        for (left, top, right, bottom, confidence, classId) in preds:
            drawPred(im, labels[int(classId)], confidence, left, top, right, bottom)
        cv2.imwrite('tested.jpg', im)
        assert(labels[preds[0][-1]] == "ham")
