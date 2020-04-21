.. _tutorial:

Tutorial
**********************

We will create a wearable cognitive assistant that recognize a person or a chair
in this tutorial. First, let's get the example code running before going into
its implementation. 

1. `Install gabrieltool <https://openworkflow.readthedocs.io/en/latest/installation.html>`_. 
2. Download `gabriel_example.py <https://github.com/cmusatyalab/OpenWorkflow/blob/master/examples/gabriel_example.py>`_
   and the `object detector <https://storage.cmusatyalab.org/openworkflow/ssd_mobilenet_v2_saved_model.zip>`_
   into the same directory. This object detector is the SSD MobileNet v2 DNN from `Tensorflow <https://github.com/tensorflow/models/blob/master/research/object_detection/g3doc/detection_model_zoo.md>`_.
   In this example, we will use this object detector to detect people and chairs.
3. Unzip the downloaded object detector into the same directory.
4. Launch the gabriel server.

.. code-block:: console

    $ ./gabriel_example run_gabriel_server

5. In the console, you should see log messages of building the FSM, starting
   gabriel server, and launching a docker container. 
6. You should also be able to see the container started using docker commands.
   Note that it may take a few minutes to download the container image before the container is started.

.. code-block:: console

    $ docker ps -a --filter="name=GABRIELTOOL"

7. Once you see the container is up, the server is ready for connection. 
   Download `Gabriel client <https://play.google.com/store/apps/details?id=edu.cmu.cs.gabrielclient>`_ 
   from Android Play Store to connect to it and try it out.

Now you've gotten the code running, let see what is happening under the hood. We
will focus on explaining how to create a gabriel server in this tutorial while
the example code contains a few more use cases of gabrieltool package. 

The application logic is created as a FSM using gabrieltool python library
below. You can also build the same FSM from the web GUI. In general, the web GUI
is good for simple application logic while the python library provides more
flexibility and supports more complicated application logic.

The FSM has two states. The first state is *st_start*. We want to
send a welcome message when a user first connects. Therefore, *st_start* doesn't
have any processing involved and will always transition immediately to the next
state and return a welcome message to the client.

The second state *st_tf* is the core of this application. When in this state,
input sensor data, which is an image in this example, is analyzed by our object
detector to see if there is a person or a chair. This is specified by a
fsm.Processor with a processor_zoo.TFServingContainerCallable. Since we want to
recognize either a person or a chair, we define two transitions, one for person,
another for chair. These transitions have predicates checking whether the person
or the chair object class exist in the output of our TFServingContainerCallable
processor. If a person is found, the person transition will be taken and return
an instruction of 'Found Person' to the Gabriel client. 

.. code-block:: python
   :linenos:

    import cv2
    import fire
    from logzero import logger
    from gabriel_server.local_engine import runner as gabriel_runner
    from gabrieltool.statemachine import fsm, predicate_zoo, processor_zoo, runner

    def _build_fsm():
        """Build an example FSM for detecting a person or a chair.

        Returns:
            gabrieltool.statemchine.fsm.State -- The start state of the generated FSM.
        """
        st_start = fsm.State(
            name='start',
            processors=[],
            transitions=[
                fsm.Transition(
                    name='tran_start_to_proc',
                    predicates=[
                        fsm.TransitionPredicate(
                            callable_obj=predicate_zoo.Always()
                        )
                    ],
                    instruction=fsm.Instruction(audio='This app will tell you if a person or a chair is present.')
                )
            ]
        )

        st_tf = fsm.State(
            name='tf_serving',
            processors=[fsm.Processor(
                name='proc_start',
                callable_obj=processor_zoo.TFServingContainerCallable('ssd_mobilenet_v2',
                                                                    'ssd_mobilenet_v2_saved_model',
                                                                    conf_threshold=0.8
                                                                    )
            )],
            transitions=[
                fsm.Transition(
                    predicates=[
                        fsm.TransitionPredicate(
                            # person id is 1 in coco labelmap
                            callable_obj=predicate_zoo.HasObjectClass(class_name='1')
                        )
                    ],
                    instruction=fsm.Instruction(audio='Found Person!')
                ),
                fsm.Transition(
                    predicates=[
                        fsm.TransitionPredicate(
                            # use the custom transition predicate we created
                            # in _add_custom_transition_predicate
                            callable_obj=predicate_zoo.HasChairClass()
                        )
                    ],
                    instruction=fsm.Instruction(audio='Found Chair!')
                )
            ]
        )

        # We need the state objects to mark the destinations of transitions
        st_start.transitions[0].next_state = st_tf
        st_tf.transitions[0].next_state = st_tf
        st_tf.transitions[1].next_state = st_tf
        return st_start

The *st_tf* state uses a custom transition predicate defined by the following
function. To learn more about the how to use and create FSM components, see its
`API documentation <https://openworkflow.readthedocs.io/en/latest/source/gabrieltool.statemachine.html#module-gabrieltool.statemachine.fsm>`_.

.. code-block:: python
   :linenos:

    def _add_custom_transition_predicates():
        """Here is how you can add a custom transition predicate to the predicate zoo

        See _build_fsm to see how this custom transition predicate is used
        """

        from gabrieltool.statemachine import callable_zoo

        class HasChairClass(callable_zoo.CallableBase):
            def __call__(self, app_state):
                # id 62 is chair
                return '62' in app_state

        predicate_zoo.HasChairClass = HasChairClass

The gabriel cognitive engine is created using a `FSM cognitive engine runner <https://openworkflow.readthedocs.io/en/latest/source/gabrieltool.statemachine.html#module-gabrieltool.statemachine.runner>`_.

.. code-block:: python
   :linenos:


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