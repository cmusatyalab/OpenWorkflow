from .base import SerializableProcessor, record_kwargs
import inspect
import json
import os
import io
import time
from functools import wraps

import cv2
import numpy as np
from logzero import logger
import copy
import requests

import docker
docker_client = docker.from_env()


class FasterRCNNContainerProcessor(SerializableProcessor):
    # UNIQUE to each python process
    CONTAINER_NAME = 'FasterRCNNContainerProcessor-{}'.format(os.getpid())
    CONTAINER_MAPPED_HOST_PORT = -1

    @record_kwargs
    def __init__(self, container_image_url, conf_threshold=0.5):
        # For default parameter settings,
        # see:
        # https://github.com/rbgirshick/fast-rcnn/blob/b612190f279da3c11dd8b1396dd5e72779f8e463/lib/fast_rcnn/config.py
        super(FasterRCNNContainerProcessor, self).__init__()
        self.container_image_url = container_image_url
        self.conf_threshold = conf_threshold
        # port number inside the container that is open
        self.container_port = '8000/tcp'
        self.container = self._get_container()
        if self.container is None or self.container.status != 'running':
            self.container = self._start_container()

    @property
    def container_server_url(self):
        return 'http://localhost:{}/detect'.format(self.CONTAINER_MAPPED_HOST_PORT)

    def _start_container(self):
        container = docker_client.containers.run(
            self.container_image_url,
            command='/bin/bash run_server.sh',
            name=self.CONTAINER_NAME,
            auto_remove=True,
            detach=True,
            ports={self.container_port: None}  # map container 8000 to a random host port
        )
        container.reload()
        time.sleep(10)
        self.CONTAINER_MAPPED_HOST_PORT = container.ports[self.container_port][0]['HostPort']
        return container

    def _get_container(self):
        containers = docker_client.containers.list(filters={'name': self.CONTAINER_NAME})
        if len(containers) > 0:
            return containers[0]
        return None

    @classmethod
    def from_json(cls, json_obj):
        try:
            kwargs = copy.copy(json_obj)
            kwargs['container_image_url'] = json_obj['container_image_url']
            kwargs['labels'] = json_obj['labels']
            kwargs['conf_threshold'] = float(json_obj['conf_threshold'])
        except ValueError as e:
            raise ValueError(
                'Failed to convert json object to {} instance. '
                'The input json object is {}'.format(cls.__name__,
                                                     json_obj))
        return cls(**kwargs)

    def __call__(self, image):
        fp = io.BytesIO()
        fp.write(cv2.imencode('.jpg', image)[1].tostring())
        fp.seek(0, 0)

        response = requests.post(self.container_server_url, data={
            'confidence': self.conf_threshold,
            'format': 'box'
        }, files={
            'picture': fp
        })
        detections = response.text
        result = {}
        for detection in detections:
            label = detection[0]
            bbox = detection[1]
            confidence = detection[2]
            if label not in result:
                result[label] = []
            result[label].append(
                [*bbox, confidence, label]
            )
        return result

    def clean(self):
        if self.container:
            self.container.remove(force=True)


if __name__ == "__main__":
    container_image_url = 'registry.cmusatyalab.org/junjuew/container-registry:tpod-image-sandwich-sandwich'
    processor = FasterRCNNContainerProcessor(container_image_url=container_image_url,
                                             conf_threshold=0.1)
    image = cv2.imread('test.png')
    print(processor(image))
    processor.clean()
