from gabriel_server.local_engine import runner as gabriel_runner
from gabriel_server import cognitive_engine
from gabriel_protocol import gabriel_pb2
from gabrieltool.statemachine import runner, fsm
import numpy as np
import instruction_pb2
import cv2
import logging
import argparse
from logzero import logger

DEFAULT_PORT = 9099
DEFAULT_NUM_TOKENS = 1
INPUT_QUEUE_MAX_SIZE = 60
ENGINE_NAME = 'instruction'

logging.basicConfig(level=logging.DEBUG)


class SandwichEngine(cognitive_engine.Engine):
    def __init__(self, fsm_path):
        self._fsm = None
        with open(fsm_path, 'rb') as f:
            self._fsm = fsm.StateMachine.from_bytes(f.read())
        self._fsm_runner = runner.Runner(self._fsm)

    def handle(self, from_client):
        if from_client.payload_type != gabriel_pb2.PayloadType.Value('IMAGE'):
            return cognitive_engine.wrong_input_format_error(
                from_client.frame_id)
        engine_fields = cognitive_engine.unpack_engine_fields(
            instruction_pb2.EngineFields, from_client)

        img_array = np.asarray(bytearray(from_client.payload), dtype=np.int8)
        img = cv2.imdecode(img_array, -1)

        inst = self._fsm_runner.feed(img)

        result_wrapper = gabriel_pb2.ResultWrapper()
        result_wrapper.engine_fields.Pack(engine_fields)
        logger.info(inst.audio)
        logger.info(type(inst.audio))

        logger.info(inst.audio)
        logger.info(type(inst.image))

        if inst.image:
            result = result_wrapper.results.add()
            result.payload_type = gabriel_pb2.PayloadType.Value('IMAGE')
            result.payload = inst.image
            result.engine_name = ENGINE_NAME

        if inst.audio:
            result = result_wrapper.results.add()
            result.payload_type = gabriel_pb2.PayloadType.Value('AUDIO')
            result.payload = inst.audio.encode(encoding="utf-8")
            result.engine_name = ENGINE_NAME

        logger.info('Current State: {}'.format(self._fsm_runner.current_state))
        logger.info(result_wrapper.results)

        result_wrapper.frame_id = from_client.frame_id
        result_wrapper.status = gabriel_pb2.ResultWrapper.Status.Value('SUCCESS')

        return result_wrapper


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-t", "--tokens", type=int, default=DEFAULT_NUM_TOKENS,
        help="number of tokens")
    parser.add_argument(
        "-f", "--pbfsm", type=str, required=True,
        help="path to pbfsm")
    parser.add_argument(
        "-p", "--port", type=int, default=DEFAULT_PORT, help="Set port number")
    args = parser.parse_args()

    def engine_setup():
        return SandwichEngine(args.pbfsm)

    gabriel_runner.run(
        engine_setup, ENGINE_NAME, INPUT_QUEUE_MAX_SIZE, args.port, args.tokens)


if __name__ == "__main__":
    main()
