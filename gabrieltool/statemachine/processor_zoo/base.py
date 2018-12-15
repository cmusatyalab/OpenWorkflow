
# -*- coding: utf-8 -*-
"""Abstract base classes for processors
"""
import inspect
import pickle
from functools import wraps

import cv2
import numpy as np
from cv2 import dnn
from logzero import logger


# TODO (junjuew): move this to cvutil?
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


def record_kwargs(func):
    """
    Automatically record constructor arguments

    >>> class process:
    ...     @record_kwargs
    ...     def __init__(self, cmd, reachable=False, user='root'):
    ...         pass
    >>> p = process('halt', True)
    >>> p.cmd, p.reachable, p.user
    ('halt', True, 'root')
    """
    names, varargs, keywords, defaults = inspect.getargspec(func)

    @wraps(func)
    def wrapper(self, *args, **kargs):
        kwargs = {}
        for name, arg in list(zip(names[1:], args)) + list(kargs.items()):
            kwargs[name] = arg

        for name, default in zip(reversed(names), reversed(defaults)):
            if not hasattr(self, name):
                kwargs[name] = default

        setattr(self, 'kwargs', kwargs)
        func(self, *args, **kargs)

    return wrapper


class SerializableProcessor(object):
    def __init__(self, *args, **kwargs):
        super(SerializableProcessor, self).__init__(*args, **kwargs)

    def to_bytes(self):
        return pickle.dumps(self.kwargs)

    @classmethod
    def from_bytes(cls, byte_repr):
        kwargs = pickle.loads(byte_repr)
        return cls(**kwargs)


class DummyProcessor(SerializableProcessor):

    @record_kwargs
    def __init__(self, dummy_input='dummy_input_value'):
        super(DummyProcessor, self).__init__()

    def __call__(self, image, debug=False):
        return {'dummy_key': 'dummy_value'}


class FasterRCNNOpenCVProcessor(SerializableProcessor):

    @record_kwargs
    def __init__(self, proto_path, model_path, labels=None, conf_threshold=0.8):
        # For default parameter settings,
        # see:
        # https://github.com/rbgirshick/fast-rcnn/blob/b612190f279da3c11dd8b1396dd5e72779f8e463/lib/fast_rcnn/config.py
        super(FasterRCNNOpenCVProcessor, self).__init__()
        self._scale = 600
        self._max_size = 1000
        # Pixel mean values (BGR order) as a (1, 1, 3) array
        # We use the same pixel mean for all networks even though it's not exactly what
        # they were trained with
        self._pixel_means = [102.9801, 115.9465, 122.7717]
        self._nms_threshold = 0.3
        self._labels = labels
        self._net = cv2.dnn.readNetFromCaffe(proto_path, model_path)
        self._conf_threshold = conf_threshold

    def _getOutputsNames(self, net):
        layersNames = net.getLayerNames()
        return [layersNames[i[0] - 1] for i in net.getUnconnectedOutLayers()]

    def __call__(self, image, debug=False):
        height, width = image.shape[:2]

        # resize image to correct size
        im_size_min = np.min(image.shape[0:2])
        im_size_max = np.max(image.shape[0:2])
        im_scale = float(self._scale) / float(im_size_min)
        # Prevent the biggest axis from being more than MAX_SIZE
        if np.round(im_scale * im_size_max) > self._max_size:
            im_scale = float(self._max_size) / float(im_size_max)
        im = cv2.resize(image, None, None, fx=im_scale, fy=im_scale,
                        interpolation=cv2.INTER_LINEAR)
        # create input data
        blob = cv2.dnn.blobFromImage(im, 1, (width, height), self._pixel_means,
                                     swapRB=False, crop=False)
        imInfo = np.array([height, width, im_scale], dtype=np.float32)
        self._net.setInput(blob, 'data')
        self._net.setInput(imInfo, 'im_info')

        # infer
        outs = self._net.forward(self._getOutputsNames(self._net))
        t, _ = self._net.getPerfProfile()
        logger.debug('Inference time: %.2f ms' % (t * 1000.0 / cv2.getTickFrequency()))

        # postprocess
        classIds = []
        confidences = []
        boxes = []
        for out in outs:
            for detection in out[0, 0]:
                confidence = detection[2]
                if confidence > self._conf_threshold:
                    left = int(detection[3])
                    top = int(detection[4])
                    right = int(detection[5])
                    bottom = int(detection[6])
                    width = right - left + 1
                    height = bottom - top + 1
                    classIds.append(int(detection[1]) - 1)  # Skip background label
                    confidences.append(float(confidence))
                    boxes.append([left, top, width, height])

        indices = cv2.dnn.NMSBoxes(boxes, confidences, self._conf_threshold, self._nms_threshold)
        results = {}
        for i in indices:
            i = i[0]
            box = boxes[i]
            left = box[0]
            top = box[1]
            width = box[2]
            height = box[3]
            classId = int(classIds[i])
            confidence = confidences[i]
            if self._labels[classId] not in results:
                results[self._labels[classId]] = []
            results[self._labels[classId]].append([left, top, left+width, top+height, confidence, classId])

        if debug:
            debug_image = image
            for (class_name, detections) in results.items():
                for detection in detections:
                    left, top, right, bottom, conf, _ = detection
                    debug_image = drawPred(debug_image, class_name, conf, left, top, right, bottom)
            cv2.imshow('debug', debug_image)
            cv2.waitKey(1)

        return results
