import inspect
import json
import os
from functools import wraps

import cv2
import numpy as np
from cv2 import dnn
from logzero import logger
import copy

from .base import SerializableProcessor, record_kwargs


class FasterRCNNContainerProcessor(SerializableProcessor):

    @record_kwargs
    def __init__(self, container_image_url, labels=None, conf_threshold=0.8):
        # For default parameter settings,
        # see:
        # https://github.com/rbgirshick/fast-rcnn/blob/b612190f279da3c11dd8b1396dd5e72779f8e463/lib/fast_rcnn/config.py
        super(FasterRCNNContainerProcessor, self).__init__()

    @classmethod
    def from_json(cls, json_obj):
        try:
            kwargs = copy.copy(json_obj)
            kwargs['labels'] = json_obj['labels']
            kwargs['_conf_threshold'] = float(json_obj['conf_threshold'])
        except ValueError as e:
            raise ValueError(
                'Failed to convert json object to {} instance. '
                'The input json object is {}'.format(cls.__name__,
                                                     json_obj))
        return cls(**kwargs)

    def __call__(self, image):
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

        if GABRIEL_DEBUG:
            debug_image = image
            for (class_name, detections) in results.items():
                for detection in detections:
                    left, top, right, bottom, conf, _ = detection
                    debug_image = drawPred(debug_image, class_name, conf, left, top, right, bottom)
            cv2.imshow('debug', debug_image)
            cv2.waitKey(1)
        logger.debug('results: {}'.format(results))
        return results
