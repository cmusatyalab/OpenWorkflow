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

from base64 import b64encode, b64decode
import cv2
import json
import multiprocessing
import numpy as np
import os
import pprint
import Queue
import socket
import struct
import sys
import threading
import time

import gabriel
import gabriel.proxy
import sandwich_fsm
from gabrieltool.statemachine import runner
LOG = gabriel.logging.getLogger(__name__)


def raw2cv_image(raw_data, gray_scale=False):
    img_array = np.asarray(bytearray(raw_data), dtype=np.int8)
    if gray_scale:
        cv_image = cv2.imdecode(img_array, 0)
    else:
        cv_image = cv2.imdecode(img_array, -1)
    return cv_image


class CookingProxy(gabriel.proxy.CognitiveProcessThread):
    def __init__(self, image_queue, output_queue, engine_id, log_flag=True):
        super(CookingProxy, self).__init__(image_queue, output_queue, engine_id)
        self.log_flag = log_flag
        self._fsm = sandwich_fsm.build_sandwich_fsm()
        self._fsm_runner = runner.Runner(self._fsm)

    def terminate(self):
        super(CookingProxy, self).terminate()

    def handle(self, header, data):
        LOG.info("received new image")

        header['status'] = "nothing"
        result = {}  # default

        img = raw2cv_image(data)
        inst = self._fsm_runner.feed(img)
        result['speech'] = inst.audio
        result['image'] = b64encode(inst.image)
        LOG.info(result)
        LOG.info('state: {}'.format(self._fsm_runner.current_state))
        return json.dumps(result)


if __name__ == "__main__":
    settings = gabriel.util.process_command_line(sys.argv[1:])

    ip_addr, port = gabriel.network.get_registry_server_address(settings.address)
    service_list = gabriel.network.get_service_list(ip_addr, port)
    LOG.info("Gabriel Server :")
    LOG.info(pprint.pformat(service_list))

    video_ip = service_list.get(gabriel.ServiceMeta.VIDEO_TCP_STREAMING_IP)
    video_port = service_list.get(gabriel.ServiceMeta.VIDEO_TCP_STREAMING_PORT)
    ucomm_ip = service_list.get(gabriel.ServiceMeta.UCOMM_SERVER_IP)
    ucomm_port = service_list.get(gabriel.ServiceMeta.UCOMM_SERVER_PORT)

    # image receiving thread
    image_queue = Queue.Queue(gabriel.Const.APP_LEVEL_TOKEN_SIZE)
    print("TOKEN SIZE OF OFFLOADING ENGINE: %d" % gabriel.Const.APP_LEVEL_TOKEN_SIZE)
    video_streaming = gabriel.proxy.SensorReceiveClient((video_ip, video_port), image_queue)
    video_streaming.start()
    video_streaming.isDaemon = True

    # app proxy
    result_queue = multiprocessing.Queue()

    app_proxy = CookingProxy(image_queue, result_queue, engine_id="Sandwich")
    app_proxy.start()
    app_proxy.isDaemon = True

    # result pub/sub
    result_pub = gabriel.proxy.ResultPublishClient((ucomm_ip, ucomm_port), result_queue)
    result_pub.start()
    result_pub.isDaemon = True

    try:
        while True:
            time.sleep(1)
    except Exception as e:
        pass
    except KeyboardInterrupt as e:
        sys.stdout.write("user exits\n")
    finally:
        if video_streaming is not None:
            video_streaming.terminate()
        if app_proxy is not None:
            app_proxy.terminate()
        result_pub.terminate()
