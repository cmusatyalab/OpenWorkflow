
# -*- coding: utf-8 -*-
"""Abstract base classes for processors
"""
import copy

import cv2
import numpy as np
from logzero import logger

from gabrieltool.statemachine.callable_zoo import record_kwargs
from gabrieltool.statemachine.callable_zoo import CallableBase


def visualize_detections(img, results):
    """Visualize object detection outputs.

    This is a helper function for debugging processor callables.
    The results should follow Gabrieltool's convention, which is

    Arguments:
        img {OpenCV Image}
        results {Dictionary} -- a dictionary of class_idx -> [[x1, y1, x2, y2, confidence, cls_idx],...]

    Returns:
        OpenCV Image -- Image with detected objects annotated
    """
    img_detections = img.copy()
    for _, dets in results.items():
        for i in range(len(dets)):
            cls_name = str(dets[i][-1])
            bbox = dets[i][:4]
            score = dets[i][-2]
            text = "%s : %f" % (cls_name, score)
            cv2.rectangle(img_detections, (int(bbox[0]), int(bbox[1])), (int(bbox[2]), int(bbox[3])), (0, 0, 255), 8)
            cv2.putText(img_detections, text, (int(bbox[0]), int(bbox[1])), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
    return img_detections


class DummyCallable(CallableBase):

    @record_kwargs
    def __init__(self, dummy_input='dummy_input_value'):
        super(DummyCallable, self).__init__()

    def __call__(self, image, debug=False):
        return {'dummy_key': 'dummy_value'}


class FasterRCNNOpenCVCallable(CallableBase):

    @record_kwargs
    def __init__(self, proto_path, model_path, labels=None, conf_threshold=0.8):
        # For default parameter settings,
        # see:
        # https://github.com/rbgirshick/fast-rcnn/blob/b612190f279da3c11dd8b1396dd5e72779f8e463/lib/fast_rcnn/config.py
        super(FasterRCNNOpenCVCallable, self).__init__()
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
        logger.debug(
            'Created a FasterRCNNOpenCVProcessor:\nDNN proto definition is at {}\n'
            'model weight is at {}\nlabels are {}\nconf_threshold is {}'.format(
                proto_path, model_path, self._labels, self._conf_threshold))

    @classmethod
    def from_json(cls, json_obj):
        try:
            kwargs = copy.copy(json_obj)
            kwargs['labels'] = json_obj['labels']
            kwargs['_conf_threshold'] = float(json_obj['conf_threshold'])
        except ValueError as e:
            raise ValueError(
                'Failed to convert json object to {} instance. '
                'The input json object is {}. ({})'.format(cls.__name__,
                                                           json_obj, e))
        return cls(**json_obj)

    def _getOutputsNames(self, net):
        layersNames = net.getLayerNames()
        return [layersNames[i[0] - 1] for i in net.getUnconnectedOutLayers()]

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

        logger.debug('results: {}'.format(results))
        return results
