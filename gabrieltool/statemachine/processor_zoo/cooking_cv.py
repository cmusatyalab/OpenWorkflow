#!/usr/bin/env python
#
# Cloudlet Infrastructure for Mobile Computing
#   - Task Assistance
#
#   Author: Zhuo Chen <zhuoc@cs.cmu.edu>
#
#   Copyright (C) 2011-2013 Carnegie Mellon University
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
#

import matplotlib
matplotlib.use('Agg')

import cv2
import json
import numpy as np
import os
import sys
import time

# faster rcnn
faster_rcnn_root = os.getenv('FASTER_RCNN_ROOT', '.')
sys.path.append(os.path.join(faster_rcnn_root, "tools"))
import _init_paths # this is necessary
from fast_rcnn.config import cfg as faster_rcnn_config
from fast_rcnn.test import im_detect
from fast_rcnn.nms_wrapper import nms

sys.path.append(os.path.join(faster_rcnn_root, "python"))
import caffe

sys.path.insert(0, "..")
import config
import zhuocv as zc

current_milli_time = lambda: int(round(time.time() * 1000))


# initialize caffe module
faster_rcnn_config.TEST.HAS_RPN = True  # Use RPN for proposals
prototxt = 'model/faster_rcnn_test.pt'
caffemodel= 'model/model.caffemodel'

if not os.path.isfile(caffemodel):
    raise IOError(('{:s} not found.').format(caffemodel))

if config.USE_GPU:
    caffe.set_mode_gpu()
    # 0 is the default GPU ID
    caffe.set_device(0)
    faster_rcnn_config.GPU_ID = 0
else:
    caffe.set_mode_cpu()


net = caffe.Net(prototxt, caffemodel, caffe.TEST)

# Warmup on a dummy image
img = 128 * np.ones((300, 500, 3), dtype=np.uint8)
for i in xrange(2):
    _, _= im_detect(net, img)
print 'caffe net has been initilized'


def detect_object(img, resize_ratio = 1):
    global net
    if config.USE_GPU:
        caffe.set_mode_gpu()
    else:
        caffe.set_mode_cpu()
    CONF_THRESH = 0.8
    NMS_THRESH = 0.3

    scores, boxes = im_detect(net, img)

    result = None
    for cls_idx in xrange(len(config.LABELS)):
        cls_idx += 1 # because we skipped background
        cls_boxes = boxes[:, 4 * cls_idx : 4 * (cls_idx + 1)]
        cls_scores = scores[:, cls_idx]

        # dets: detected results, each line is in [x1, y1, x2, y2, confidence] format
        dets = np.hstack((cls_boxes, cls_scores[:, np.newaxis])).astype(np.float32)

        # non maximum suppression
        keep = nms(dets, NMS_THRESH)
        dets = dets[keep, :]

        # filter out low confidence scores
        inds = np.where(dets[:, -1] >= CONF_THRESH)[0]
        dets = dets[inds, :]

        # now change dets format to [x1, y1, x2, y2, confidence, cls_idx]
        dets = np.hstack((dets, np.ones((dets.shape[0], 1)) * (cls_idx - 1)))

        # combine with previous results (for other classes)
        if result is None:
            result = dets
        else:
            result = np.vstack((result, dets))

    if result is not None:
        result[:, :4] /= resize_ratio

    return (img, result)

def process(img, resize_ratio = 1, display_list = []):
    img_object, result = detect_object(img, resize_ratio)
    zc.check_and_display('object', img_object, display_list, wait_time = config.DISPLAY_WAIT_TIME, resize_max = config.DISPLAY_MAX_PIXEL)

    rtn_msg = {'status' : 'success'}
    return (rtn_msg, json.dumps(result.tolist()))
