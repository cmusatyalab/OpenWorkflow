# -*- coding: utf-8 -*-
"""Components to Create a Finite State Machine.

See FSM's wikipedia page for its basics:
https://en.wikipedia.org/wiki/Finite-state_machine.

This modules provides components to create, edit, serialize, and deserialize a
finite state machine. Below is a list of key concepts.
  * State: FSM states represents the status of a cognitive assistant. States
    have Processors, which are executed to analyze the input data when the
    application is in the state.
  * Transitions: Transitions define the conditions (TransitionPredicate) for
    state change and actions (Instruction) to take when changing states.
  * Finite State Machine (StateMachine): An FSM is a set of states and
    transitions. Helper functions are provided in the StateMachine class for
    serialization, deserialization and traversal.
"""


import json

from gabrieltool.statemachine import (predicate_zoo, processor_zoo,
                                      callable_zoo,
                                      wca_state_machine_pb2)


class _FSMObjBase:
    """Base class for all FSM component classes.

    This base class serves as an adapter to help serialize/deserialize
    components into the protobuf message formats defined in
    proto/wca-state-machine.proto. Variables defined in the proto are exposed as
    instance variables.
    """
    _obj_cnt = 0

    def __init__(self, name=None):
        """Constructor

        A protobuf message is created to store all the variables for
        serialization.

        Args:
            name (string, optional): name of the component. Defaults to None.
        """

        super().__init__()
        _FSMObjBase._obj_cnt += 1
        protobuf_message = getattr(wca_state_machine_pb2,
                                   self.__class__.__name__)()
        self._pb = protobuf_message
        self._expose_serializer_attr('name', 'rw')
        self.name = self._get_default_name()
        if name is not None:
            self.name = name

    def _get_default_name(self):
        return '{}_{}'.format(self.__class__.__name__,
                              _FSMObjBase._obj_cnt)

    def __repr__(self):
        default = super(_FSMObjBase, self).__repr__()
        return '<{} ({})>'.format(self.name, default)

    def _expose_serializer_attr(self, name, mode):
        """Helper method to provide easy access to read and write the protobuf message as instance variables."""
        if mode == 'r':
            setattr(_FSMObjBase, name, property(
                lambda self: getattr(self._pb, name)))
        elif mode == 'rw':
            setattr(_FSMObjBase,
                    name,
                    property(lambda self: getattr(self._pb, name),
                             lambda self, value: setattr(
                                 self._pb, name, value)
                             ))
        else:
            raise ValueError(
                'Unsupported mode {}. Valid modes are "r" or "rw"'.format(mode))

    def from_desc(self, desc):
        """Construct an object from its serialized description."""
        self._pb = desc

    def to_desc(self):
        """Returned the serialized description of this object as a protobuf message."""
        return self._pb


class _FSMCallable(_FSMObjBase):
    """A callable FSM component.

    This serves as a base class for FSM components that needs to implement a
    callable interface (e.g. Processor, TransitionPredicate).
    """

    def __init__(self, name=None, callable_obj=None, zoo=None):
        super().__init__(name)
        self._callable_zoo = zoo
        self.callable_obj = callable_obj if callable_obj is not None else callable_zoo.Null()

    @property
    def callable_obj(self):
        """The callable object to invoke when this object is called."""
        return self._callable_obj

    @callable_obj.setter
    def callable_obj(self, obj):
        if not isinstance(obj, callable_zoo.CallableBase):
            raise TypeError(
                'Invalid type ({}). '
                '_FSMCallable\'s callable_obj requires '
                'a callable_zoo.CallableBase object.'.format(type(obj)))
        self._callable_obj = obj

    def prepare(self):
        """Invoke prepare() method of the callable_obj if it has any.

        This prepare method is called when the FSM runner starts executing to
        give callables an opportunity to initialize themselves.
        """
        prepare_func = getattr(self._callable_obj, "prepare", None)
        if callable(prepare_func):
            prepare_func()

    def __call__(self, current_input):
        return self._callable_obj(current_input)

    def from_desc(self, data):
        super().from_desc(data)
        callable_class = getattr(self._callable_zoo, self._pb.callable_name)
        initializer_args = json.loads(self._pb.callable_args)
        self._callable_obj = callable_class.from_json(initializer_args)

    def to_desc(self):
        self._pb.callable_name = self._callable_obj.__class__.__name__
        self._pb.callable_args = json.dumps(self._callable_obj.kwargs)
        return super().to_desc()


class Processor(_FSMCallable):
    """Processor specifies how to process input (e.g. an image) in a state.
    """

    def __init__(self, name=None, callable_obj=None):
        """Construct a processor.

        Args:
            name (string, optional): Name of the processor. Defaults to None.
            callable_obj (subclass of callable_zoo.CallableBase, optional): An
                object whose type is a subclass of callable_zoo.CallableBase.
                This object is called/executed when there is a new input (e.g. an image).
                This callable_obj should expect exact one positional argument. Defaults to None.
        """
        super().__init__(name=name, callable_obj=callable_obj, zoo=processor_zoo)


class TransitionPredicate(_FSMCallable):
    """Condition for state transition.

    TransitionPredicate determines whether a state transition should taken.
    TransitionPredciate implements the callable interface so that its objects
    can be evaluated as a function. A state transition is taken when a
    TransitionPredicate evaluates to True.
    """

    def __init__(self, name=None, callable_obj=None):
        """Construct a transition predicate.

        Args:
            name (string, optional): Name of the TransitionPredicate. Defaults to None.
            callable_obj (subclass of callable_zoo.CallableBase, optional): An
                object whose type is a subclass of callable_zoo.CallableBase. This
                object is called/executed when this transition predicate is called
                to determine whether the current transition should be taken.
                This callable_obj should expect exact one positional argument of type dictionary,
                which contains the output of current state's processors. Defaults to None.
        """
        super().__init__(name=name, callable_obj=callable_obj, zoo=predicate_zoo)


class Instruction(_FSMObjBase):
    """Instruction to return when a transition is taken."""

    def __init__(self, name=None, audio=None, image=None, video=None):
        """Instructions can have audio, image, or video.

        Args:
            name (string, optional): Name of the instruction. Defaults to None.
            audio (string, optional): Verbal instruction in text. Defaults to None.
            image (bytes, optional): Encoded Image in bytes. Defaults to None.
            video (url string, optional): Video Url in string. Defaults to None.
        """
        super(Instruction, self).__init__(name=name)
        expose_attrs = [('audio', 'rw'), ('image', 'rw'), ('video', 'rw')]
        for (attr, mode) in expose_attrs:
            self._expose_serializer_attr(attr, mode)
        if audio is not None:
            self.audio = audio
        if image is not None:
            self.image = image
        if video is not None:
            self.video = video


class Transition(_FSMObjBase):
    """Links among FSM states that defines state changes and results to return when changing states.

    A Transition has the following components:
      * transition predicates: The conditions that need to be satisfied to take this transition.
      * next_state: The next FSM state to visit after taking the transition.
      * instructions: Instructions returned to users when this
        transition is taken.
    """

    def __init__(self, name=None, predicates=None, instruction=None, next_state=None):
        """Construct a Transition

        Args:
            name (string, optional): Name of the transition. Defaults to None.
            predicates (a list of TransitionPredicate, optional): A list of
                condition to satisfy. They are daisy-chained (AND) together when
                evaluating whether this transition takes place. Defaults to None.
            instruction (Instruction, optional): Instruction to give. Defaults to None.
            next_state (State, optional): Next state to move to. Defaults to None.
        """
        super(Transition, self).__init__(name)
        self.predicates = predicates if predicates is not None else []
        self.instruction = instruction if instruction is not None else Instruction()
        self.next_state = next_state

    @property
    def predicates(self):
        """The list of TransitionPredicates."""
        return self._predicates

    @predicates.setter
    def predicates(self, val):
        if type(val) != list:
            raise TypeError("Predicates needs to be type list.")
        self._predicates = val

    def __call__(self, app_state):
        """Given the current app_state, check if a transition should be taken.

        The condition of taking a transition is that all the trigger predicates
        are satisfied. When all of them are satisfied, return True, next state,
        and instruction. Otherwise, return False, None, None.
        """
        for predicate in self._predicates:
            if not predicate(app_state):
                return None
        return self

    def to_desc(self):
        for pred in self._predicates:
            self._pb.predicates.extend([pred.to_desc()])
        if self.instruction is not None:
            self._pb.instruction.CopyFrom(self.instruction.to_desc())
        if self.next_state:
            self._pb.next_state = self.next_state.name
        return super(Transition, self).to_desc()

    def from_desc(self):
        """Do not call this method directly.

        Transition itself does not know enough information to build from its
        description. next_state variable depends on a FSM. Use StateMachine Helper Class instead.

        Raises:
            NotImplementedError: Always
        """
        raise NotImplementedError("Transition itself does not know enough information "
                                  "to build from its description. "
                                  "next_state variable depends on a FSM. "
                                  "Use StateMachine Helper Class instead.")


class State(_FSMObjBase):
    """A FSM state represents the status of the system.

    A state can have many processors and transitions.
    """

    def __init__(self, name=None, processors=None, transitions=None):
        """Construct a FSM state.

        Args:
            name (string, required): Name of the State. Each state in a FSM needs to
                have an unique name.
            processors (list of Processor, optional): Processor to run on an
                input in this state. Each processor will be called with exactly one
                positional argument (input), and should return a dictionary that
                contains the extracted information. The returned dictionaries from
                multiple processors will be unioned together to serve as inputs to
                transition predicates. Defaults to None.
            transitions (list of Transition, optional): Possible Transitions
                from this state. Transitions are evaluated one by one in the order
                of this list. The first transition that satisfies will be taken.
                Defaults to None.
        """
        super(State, self).__init__(name)
        self.processors = processors if processors is not None else []
        self.transitions = transitions if transitions is not None else []

    @property
    def processors(self):
        """The list of processors to be executed in this state."""
        return self._processors

    @processors.setter
    def processors(self, val):
        if type(val) != list:
            raise TypeError("Predicates needs to be type list.")
        self._processors = val

    @property
    def transitions(self):
        """The list of possible transitions to take in this state."""
        return self._transitions

    @transitions.setter
    def transitions(self, val):
        if type(val) != list:
            raise TypeError("Predicates needs to be type list.")
        self._transitions = val

    def _run_processors(self, img):
        app_state = {'raw': img}
        for obj_processor in self.processors:
            app_state.update(obj_processor(img))
        return app_state

    def _get_one_satisfied_transition(self, app_state):
        for transition in self.transitions:
            if transition(app_state) is not None:
                return transition
        return None

    def prepare(self):
        """Prepare a state (e.g. initialize all processors and transition predicates.)

        This method is called when the FSM runner first starts to
        give callables an opportunity to initialize themselves.
        """
        for obj_processor in self.processors:
            obj_processor.prepare()

    def __call__(self, img):
        app_state = self._run_processors(img)
        transition = self._get_one_satisfied_transition(app_state)
        if transition is None:
            return self, Instruction()
        else:
            return transition.next_state, transition.instruction

    def to_desc(self):
        for proc in self.processors:
            self._pb.processors.extend([proc.to_desc()])
        for tran in self.transitions:
            self._pb.transitions.extend([tran.to_desc()])
        return super(State, self).to_desc()

    def from_desc(self):
        """Do not call this method directly.

        State itself does not know enough information to build from its
        description. The next_state in state's transitions depends on a FSM. Use StateMachine Helper Class instead.

        Raises:
            NotImplementedError: Always
        """
        raise NotImplementedError("State itself does not know enough information "
                                  "to build from its description. "
                                  "next_state variable depends on a FSM. "
                                  "Use StateMachine Helper Class instead.")


class StateMachine(object):
    """Helper class to serialize, deserialize, and traverse a state machine.
    """

    @classmethod
    def _load_generic_from_desc(cls, GenericType, desc):
        item = GenericType()
        item.from_desc(desc)
        return item

    @classmethod
    def _load_transition(cls, desc, state_lut):
        tran = Transition(name=desc.name)
        tran.instruction = cls._load_generic_from_desc(Instruction,
                                                       desc.instruction)
        preds = [cls._load_generic_from_desc(
            TransitionPredicate, pred_desc)
            for pred_desc in desc.predicates]
        tran._predicates = preds
        tran.next_state = state_lut[desc.next_state]
        return tran

    @classmethod
    def _load_state(cls, desc, state_lut):
        state = state_lut[desc.name]
        state.processors = [cls._load_generic_from_desc(
            Processor, proc_desc) for proc_desc in desc.processors]
        state.transitions = [cls._load_transition(
            tran_desc, state_lut) for tran_desc in desc.transitions]
        return state

    @classmethod
    def from_bytes(cls, data):
        """Load a State Machine from bytes.

        Args:
            data (bytes): Serialized FSM in bytes. Format is specified in
            wca_state_machine.proto.

        Raises:
            ValueError: raised when there are duplicate state names.

        Returns:
            State: The start state of the FSM.
        """
        pb_fsm = wca_state_machine_pb2.StateMachine()
        pb_fsm.ParseFromString(data)
        state_lut = {}
        # 1st pass get all states
        for state_desc in pb_fsm.states:
            state = State(name=state_desc.name)
            if state.name in state_lut:
                raise ValueError(
                    "Duplicate State Name: {}. Invalid State Machine Data.".format(
                        state.name))
            state_lut[state.name] = state
        # 2nd pass to load all state details
        for state_desc in pb_fsm.states:
            cls._load_state(state_desc, state_lut)
        return state_lut[pb_fsm.start_state]

    @classmethod
    def bfs(cls, start_state):
        """Generator for a breadth-first traversal on the FSM.

        This method can be used to enumerate states in an FSM.

        Args:
            start_state (State): The start state of the traversal.

        Yields:
            State: The current state of the traversal.
        """
        visited = set([start_state])
        work_queue = [start_state]
        while work_queue:
            state = work_queue.pop(0)
            for tran in state.transitions:
                if tran.next_state is not None and tran.next_state not in visited:
                    work_queue.append(tran.next_state)
                    visited.add(tran.next_state)
            yield state

    @classmethod
    def to_bytes(cls, name, start_state):
        """Serialize a FSM to bytes.

        States in the FSM are discovered using a breadth-first search (see the
        bfs method in this class).

        Args:
            name (string): The name of the FSM.
            start_state (State): The start state of the FSM.

        Raises:
            ValueError: raised when there are duplicate state names.

        Returns:
            bytes: Serialized FSM in bytes. Format is defined in wca_state_machine.proto.
        """
        # TODO(junjuew) optimize/dedup assets/kwargs
        visited = {}
        for state in cls.bfs(start_state):
            if state.name in visited and visited[state.name] is not state:
                raise ValueError("Found duplicate state name {}. "
                                 "Cannot serialize a FSM with duplicate state name".format(state.name))
            visited[state.name] = state

        # serialize
        pb_fsm = wca_state_machine_pb2.StateMachine(
            name=name, start_state=start_state.name)
        for (state_name, state) in list(visited.items()):
            pb_fsm.states.extend([state.to_desc()])
        return pb_fsm.SerializeToString()
