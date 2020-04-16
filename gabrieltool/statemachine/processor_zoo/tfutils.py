import numpy as np
import tensorflow as tf
from grpc.beta import implementations
from logzero import logger
from object_detection.utils import label_map_util
from object_detection.utils import visualization_utils as vis_util
from tensorflow_serving.apis import predict_pb2, prediction_service_pb2


class TFServingPredictor(object):
    def __init__(self, host, port):
        self.channel = implementations.insecure_channel(host, int(port))
        self.stub = prediction_service_pb2.beta_create_PredictionService_stub(self.channel)

    def infer_one(self, model_name, rgb_image):
        return self.infer(np.stack([rgb_image.astype(dtype=np.uint8)], axis=0))

    def infer(self, model_name, images):
        # Create prediction request object
        request = predict_pb2.PredictRequest()
        # Specify model name (must be the same as when the TensorFlow serving serving was started)
        request.model_spec.name = model_name
        # Initalize prediction
        request.inputs['inputs'].CopyFrom(
            tf.make_tensor_proto(images))
        # Call the prediction server
        result = self.stub.Predict(request, 10.0)  # 10 secs timeout
        # convert tensorProto to numpy array
        parsed_results = {}
        for k, v in result.outputs.items():
            parsed_results[k] = tf.make_ndarray(v)
        # fix output result types
        if 'detection_classes' in parsed_results:
            parsed_results['detection_classes'] = parsed_results['detection_classes'].astype(np.int64)
        return parsed_results
