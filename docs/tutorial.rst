.. _tutorial:

Tutorial
**********************

We will create a wearable cognitive assistant that recognize a person or a chair
in this tutorial. The complete code is `here
<https://github.com/cmusatyalab/OpenWorkflow/blob/master/examples/gabriel_example.py>`_.
The code contains a few more use cases of gabrieltool package. We
will focus on creating a gabriel server in this example.

To recognize a person or a chair, we will use a SSD MobileNet v2 object detector
network from Tensorflow. Download and decompress the detector from
`to_fill <>`_.

Next, let's build a two-state FSM. The first state *st_start* is where our FSM
starts from. We want to send a welcoming message when a user first connects.
Therefore, *st_start* doesn't have any processing involved and will always
transition immediately to the next state while returning a welcome message to the client.

The second state *st_tf* is the core of this application. When in this state,
input sensor data, which is an image in this example, is analyzed by our object
detector to see if there is a person or a chair. This is specified by a
fsm.Processor with a processor_zoo.TFServingContainerCallable. Since we want to
recognize either a person or a chair, we define two transitions, one for person,
one for chair to give user instructions. These transitions have predicates
checking whether the person or the chair class exist in the output of our
TFServingContainerCallable processor. If a person is found, the person
transition will be taken and return an instruction of 'Found Person' to the
Gabriel client. 

::

    def _build_fsm():
        st_start = fsm.State(
            name='start',
            processors=[],
            transitions=[
                fsm.Transition(
                    name='tran_start_to_proc',
                    predicates=[
                        fsm.TransitionPredicate(
                            partial_obj=functools.partial(
                                predicate_zoo.always
                            )
                        )
                    ],
                    instruction=fsm.Instruction(audio='This app will tell you if a person or a chair is present.')
                )
            ]
        )

        st_tf = fsm.State(
            name='tf_serving',
            processors=[fsm.Processor(
                name='proc_process',
                callable_obj=processor_zoo.TFServingContainerCallable('ssd_mobilenet_v2',
                                                                    'examples/ssd_mobilenet_v2_saved_model',
                                                                    conf_threshold=0.8
                                                                    )
            )],
            transitions=[
                fsm.Transition(
                    predicates=[
                        fsm.TransitionPredicate(
                            partial_obj=functools.partial(
                                predicate_zoo.has_obj_cls,
                                cls_name='1'  # 1 is Person
                            )
                        )
                    ],
                    instruction=fsm.Instruction(audio='Found Person!')
                ),
                fsm.Transition(
                    predicates=[
                        fsm.TransitionPredicate(
                            partial_obj=functools.partial(
                                predicate_zoo.has_obj_cls,
                                cls_name='62' # 62 is chair
                            )
                        )
                    ],
                    instruction=fsm.Instruction(audio='Found Chair!')
                )
            ]
        )

        # transitions are created after the state objects
        st_start.transitions[0].next_state = st_tf
        st_tf.transitions[0].next_state = st_tf
        st_tf.transitions[1].next_state = st_tf
        return st_start

Now, let's launch a gabriel server using this FSM.

::

    def run_gabriel_server():
        """Create and execute a gabriel server for detecting people.

        This gabriel server uses a gabrieltool.statemachine.fsm to represents
        application logic. Use Gabriel Client to stream images and receive feedback.
        """
        logger.info('Building Person Detection FSM...')
        start_state = _build_fsm()
        logger.info('Initializing Cognitive Engine...')
        # engine_name has to be 'instruction' to work with
        # gabriel client from App Store. Someone working on Gabriel needs to fix this.
        engine_name = 'instruction'
        logger.info('Launching Gabriel server...')
        gabriel_runner.run(
            engine_setup=lambda: runner.BasicCognitiveEngineRunner(
                engine_name=engine_name, fsm=start_state),
            engine_name=engine_name,
            input_queue_maxsize=60,
            port=9099,
            num_tokens=1
        )

Now, the server is ready. Download `Gabriel client
<https://play.google.com/store/apps/details?id=edu.cmu.cs.gabrielclient>`_ from
Android Play Store and try it out.

You can also build this WCA from the web GUI.