# -*- coding: utf-8 -*-
"""Finite State Machine Runner.

Runner to run the cognitive assistants that are expressed as state machines.
"""

import cv2
import numpy as np
from gabriel_protocol import gabriel_pb2
from gabriel_server import cognitive_engine
from logzero import logger

from gabrieltool.statemachine import fsm, instruction_pb2


class Runner(object):
    """Finite State Machine Runner.

    A basic finite state machine runner.
    Make sure the fsm is constructed fully before creating a runner.
    """

    def __init__(self, start_state, prepare_to_run=True):
        """Construct a FSM runner.

        Args:
            start_state (State): The start state of a FSM.
            prepare_to_run (bool, optional): Whether to call prepare() functions
                on all state before running. It should be set to true unless debugging.
                Defaults to True.
        """
        super(Runner, self).__init__()
        self.current_state = start_state
        if prepare_to_run:
            self._prepare_to_run()

    def feed(self, data, debug=False):
        """Feed the FSM an input to get an output.

        Args:
            data (any): Input data.
            debug (bool, optional): Defaults to False.

        Raises:
            ValueError: when current state is None.

        Returns:
            Instruction: Instruction from the FSM.
        """
        if self.current_state is None:
            raise ValueError('Current State is None! Did you forget to specify transition\'s next_state?')
        next_state, instruction = self.current_state(data)
        self.current_state = next_state
        return instruction

    def _prepare_to_run(self):
        """Prepare each state in the state machine to run.

        This allows each state to load asset from disks, start container, etc.
        Each state's behavior should be implemented in their prepare function.
        """
        for state in fsm.StateMachine.bfs(self.current_state):
            state.prepare()


class BasicCognitiveEngineRunner(cognitive_engine.Engine):
    """A basic Gabriel Cognitive Engine Runner for FSM based cognitive assistants.

    This runner will start a Gabriel cognitive engine that follows the logic
    defined in a FSM. This class is basic as it restricts the sensor input to be
    images and the instruction output to be audio or images.
    """

    def __init__(self, engine_name, fsm):
        """Construct a Gabriel Cognitive Engine Runner.

        Args:
            engine_name (string): Name of the cognitive engine.
            fsm (State): The start state of an FSM.
        """
        super(BasicCognitiveEngineRunner, self).__init__()
        self.engine_name = engine_name
        self._fsm = fsm
        self._fsm_runner = Runner(self._fsm)

    def handle(self, from_client):
        """Do not call directly.

        This method is invoked by the gabriel framework when a user input is available.
        """
        if from_client.payload_type != gabriel_pb2.PayloadType.Value('IMAGE'):
            return cognitive_engine.wrong_input_format_error(
                from_client.frame_id)
        engine_fields = cognitive_engine.unpack_engine_fields(
            instruction_pb2.EngineFields, from_client)

        img_array = np.asarray(bytearray(from_client.payload), dtype=np.int8)
        img = cv2.imdecode(img_array, -1)

        inst = self._fsm_runner.feed(img)

        result_wrapper = gabriel_pb2.ResultWrapper()
        engine_fields.update_count += 1
        result_wrapper.engine_fields.Pack(engine_fields)

        if inst.image:
            result = result_wrapper.results.add()
            result.payload_type = gabriel_pb2.PayloadType.Value('IMAGE')
            result.payload = inst.image
            result.engine_name = self.engine_name

        if inst.audio:
            result = result_wrapper.results.add()
            result.payload_type = gabriel_pb2.PayloadType.Value('TEXT')
            result.payload = inst.audio.encode(encoding="utf-8")
            result.engine_name = self.engine_name

        logger.info('Current State: {}'.format(self._fsm_runner.current_state))
        logger.info(result_wrapper.results)

        result_wrapper.frame_id = from_client.frame_id
        result_wrapper.status = gabriel_pb2.ResultWrapper.Status.Value('SUCCESS')

        return result_wrapper
