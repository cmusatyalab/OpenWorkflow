import ast
import copy
import inspect
import io
import json
import os
import time
from functools import wraps

import cv2
import docker
import numpy as np
import requests
from logzero import logger

from .base import SerializableCallable, record_kwargs
from . import tfutils

docker_client = docker.from_env()


class SingletonContainerManager(object):
    """Helper class to start, get, and remove a container identified by a name."""

    def __init__(self, container_name):
        self._container_name = container_name
        self._container = None

    @property
    def container_name(self):
        return self._container_name

    @property
    def container(self):
        if self._container is None:
            self._container = self._get_container_obj()
        return self._container

    def start_container(self, image_url, command, ports):
        if self.container is None or self.container.status != 'running':
            container = docker_client.containers.run(
                image_url,
                command=command,
                name=self.container_name,
                auto_remove=True,
                detach=True,
                ports=ports
            )
            container.reload()
            time.sleep(10)
            self._container = container
        return self._container

    def _get_container_obj(self):
        containers = docker_client.containers.list(filters={'name': self.container_name})
        if len(containers) > 0:
            return containers[0]
        return None

    def clean(self):
        container = self._get_container_obj()
        if container:
            container.remove(force=True)


class FasterRCNNContainerCallable(SerializableCallable):
    # UNIQUE to each python process
    CONTAINER_NAME = 'GABRIELTOOL-FasterRCNNContainerCallable-{}'.format(os.getpid())

    @record_kwargs
    def __init__(self, container_image_url, conf_threshold=0.5):
        # For default parameter settings,
        # see:
        # https://github.com/rbgirshick/fast-rcnn/blob/b612190f279da3c11dd8b1396dd5e72779f8e463/lib/fast_rcnn/config.py
        super(FasterRCNNContainerCallable, self).__init__()
        self.container_image_url = container_image_url
        self.conf_threshold = conf_threshold
        self.container_manager = SingletonContainerManager(self.CONTAINER_NAME)

        # start container
        # port number inside the container that is open
        self.container_port = '8000/tcp'
        ports = {self.container_port: None}   # map container 8000 to a random host port
        command = '/bin/bash run_server.sh',
        self.container_manager.start_container(self.container_image_url, command, ports)

    @property
    def container_server_url(self):
        if self.container_manager.container is not None and self.container_manager.container.status == 'running':
            return 'http://localhost:{}/detect'.format(self.container_manager.container.ports[self.container_port][0]['HostPort'])
        return None

    @classmethod
    def from_json(cls, json_obj):
        try:
            kwargs = copy.copy(json_obj)
            kwargs['container_image_url'] = json_obj['container_image_url']
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
        detections = ast.literal_eval(response.text)
        result = {}
        for detection in detections:
            logger.info(detection)
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
        self.container_manager.clean()


class TFServingContainerCallable(SerializableCallable):
    """Processor from frozen tensorflow models."""

    # UNIQUE to each python process
    CONTAINER_NAME = 'GABRIELTOOL-TFServingContainerCallable-{}'.format(os.getpid())
    TFSERVING_GRPC_PORT = 8500

    @record_kwargs
    def __init__(self, container_image_url, model_name, conf_threshold=0.5):
        super(TFServingContainerCallable, self).__init__()
        self.container_image_url = container_image_url
        self.model_name = model_name
        self.conf_threshold = conf_threshold
        self.container_manager = SingletonContainerManager(self.CONTAINER_NAME)

        # 8500 is the default gRPC port for TF-serving
        self.container_port = '{}/tcp'.format(self.TFSERVING_GRPC_PORT)
        self.predictor = tfutils.TFServingPredictor('localhost', self.TFSERVING_GRPC_PORT)

    def _start_container(self):
        ports = {self.container_port: None}
        container_image_url = self.container_image_url
        self.container_manager.start_container(container_image_url, None, ports)

    @property
    def container_server_url(self):
        if self.container_manager.container is not None and self.container_manager.container.status == 'running':
            return 'http://localhost:{}/detect'.format(self.container_manager.container.ports[self.container_port][0]['HostPort'])
        return None

    @classmethod
    def from_json(cls, json_obj):
        try:
            kwargs = copy.copy(json_obj)
            kwargs['container_image_url'] = json_obj['container_image_url']
            kwargs['conf_threshold'] = float(json_obj['conf_threshold'])
        except ValueError as e:
            raise ValueError(
                'Failed to convert json object to {} instance. '
                'The input json object is {}'.format(cls.__name__,
                                                     json_obj))
        return cls(**kwargs)

    def __call__(self, image):
        detections = self.predictor.infer_one(self.model_name, image)
        result = {}
        for detection in detections:
            logger.info(detection)
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
        self.container_manager.clean()


if __name__ == "__main__":
    container_image_url = 'registry.cmusatyalab.org/junjuew/container-registry:tpod-image-sandwich-sandwich'
    processor = FasterRCNNContainerCallable(container_image_url=container_image_url,
                                            conf_threshold=0.1)
    image = cv2.imread('test.png')
    print(processor(image))
    processor.clean()
