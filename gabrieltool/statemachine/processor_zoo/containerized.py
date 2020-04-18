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

from .base import SerializableCallable, record_kwargs, visualize_detections
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

    def start_container(self, image_url, command, **kwargs):
        if self.container is None or self.container.status != 'running':
            logger.info(
                'launching Docker container (name: {}, image: {}, command: {}, extra args: {})'.format(
                    self.container_name,
                    image_url,
                    command,
                    str(kwargs)
                ))
            container = docker_client.containers.run(
                image_url,
                command=command,
                name=self.container_name,
                auto_remove=True,
                detach=True,
                **kwargs
            )
            container.reload()
            # sleep here to give some time for container to start
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
        self.container_manager.start_container(self.container_image_url, command, ports=ports)

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
    """Processor from frozen tensorflow models.

    Containers are started lazily when a runner is starting to run.
    """

    # UNIQUE to each python process
    CONTAINER_NAME = 'GABRIELTOOL-TFServingContainerCallable-{}'.format(os.getpid())
    # TF Serving image by default listens on 8500 for GRPC
    TFSERVING_GRPC_PORT = 8500
    SERVED_DIRS = {}

    @record_kwargs
    def __init__(self, model_name, serving_dir, conf_threshold=0.5):
        super(TFServingContainerCallable, self).__init__()
        self.serving_dir = serving_dir
        self.model_name = model_name
        self.conf_threshold = conf_threshold
        TFServingContainerCallable.SERVED_DIRS[model_name] = os.path.abspath(serving_dir)
        self.container_manager = SingletonContainerManager(TFServingContainerCallable.CONTAINER_NAME)
        self.container_internal_port = '{}/tcp'.format(TFServingContainerCallable.TFSERVING_GRPC_PORT)
        self.predictor = None

    def prepare(self):
        """Launch the TF serving container.
        This is done in a separate function, because we want one TF serving
        container to serve all the served_dirs for this class.
        """
        # launch container
        self._start_container()

    def _start_container(self):
        """Launch TF serving container image to serve all entries in SERVED_DIRS."""
        ports = {self.container_internal_port: None}
        container_image_url = 'tensorflow/serving'
        # geerate model config
        from tensorflow_serving.config import model_server_config_pb2
        from google.protobuf import text_format
        model_server_config = model_server_config_pb2.ModelServerConfig()
        for model_name, model_dir in TFServingContainerCallable.SERVED_DIRS.items():
            model_config = model_server_config.model_config_list.config.add()
            model_config.name = model_name
            model_config.base_path = '/models/{}'.format(model_name)
            model_config.model_platform = 'tensorflow'
        with open('models.config', 'w') as f:
            f.write(text_format.MessageToString(model_server_config))
        # mount volumes
        volumes = {
            os.path.abspath('models.config'): {'bind': '/models/models.config', 'mode': 'ro'}
        }
        for model_name, model_dir in TFServingContainerCallable.SERVED_DIRS.items():
            volumes[model_dir] = {'bind': '/models/{}'.format(model_name), 'mode': 'ro'}
        logger.debug('volumes: {}'.format(volumes))
        cmd = '--model_config_file=/models/models.config'
        self.container_manager.start_container(container_image_url, cmd, ports=ports, volumes=volumes)

    @property
    def container_external_port(self):
        if self.container_manager.container is not None and self.container_manager.container.status == 'running':
            return self.container_manager.container.ports[self.container_internal_port][0]['HostPort']
        return None

    @classmethod
    def from_json(cls, json_obj):
        try:
            kwargs = copy.copy(json_obj)
            kwargs['model_name'] = json_obj['model_name']
            kwargs['serving_dir'] = json_obj['serving_dir']
            kwargs['conf_threshold'] = float(json_obj['conf_threshold'])
        except ValueError as e:
            raise ValueError(
                'Failed to convert json object to {} instance. '
                'The input json object is {}'.format(cls.__name__,
                                                     json_obj))
        return cls(**kwargs)

    def __call__(self, image):
        if not self.predictor:
            self.predictor = tfutils.TFServingPredictor('localhost', self.container_external_port)
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.predictor.infer_one(self.model_name, rgb_image, conf_threshold=self.conf_threshold)

        # # debug
        # debug_image = visualize_detections(image, results)
        # cv2.imshow('debug', debug_image)
        # cv2.waitKey(1)
        return results

    def clean(self):
        self.container_manager.clean()


if __name__ == "__main__":
    container_image_url = 'registry.cmusatyalab.org/junjuew/container-registry:tpod-image-sandwich-sandwich'
    processor = FasterRCNNContainerCallable(container_image_url=container_image_url,
                                            conf_threshold=0.1)
    image = cv2.imread('test.png')
    print(processor(image))
    processor.clean()
