Quickstart
**********************

Python Library gabrieltool
-------------------------------------

Create a Two State FSM

.. code-block:: python
   :linenos:

    from gabrieltool.statemachine import fsm, predicate_zoo, processor_zoo

    # create a two state state machine
    st_start = fsm.State(
        name='start',
        processors=[fsm.Processor(
            name='proc_start',
            callable_obj=processor_zoo.DummyCallable()
        )],
        transitions=[
            fsm.Transition(
                name='tran_start_to_end',
                predicates=[
                    fsm.TransitionPredicate(
                        callable_obj=predicate_zoo.Always()
                    )
                ]
            )
        ]
    )
    st_end = fsm.State(
        name='end'
    )
    st_start.transitions[0].next_state = st_end

.. _python_save_fsm:

Save the FSM to a file

.. code-block:: python
   :linenos:

    # save to disk
    with open('simple.pbfsm', 'wb') as f:
        f.write(fsm.StateMachine.to_bytes(
            name='simple_fsm',
            start_state=st_start
        ))

Launch a gabriel server using the FSM.

.. code-block:: console

    $ gbt run ./simple.pbfsm

See :ref:`tutorial` for a detailed example.

OpenWorkflow State Machine Editor
-------------------------------------

The editor is hosted at `<https://cmusatyalab.github.io/OpenWorkflow/>`_. An
instruction video is available `here <https://youtu.be/L9ugONLpnwc>`_. 

This web editor provides the following functionalities.

1. Import to view a saved FSM file. This FSM file can be created either from :ref:`gabrieltool<python_save_fsm>` or from the web editor.
2. Export a FSM to a file.
3. Edit FSM states and transitions. Note that only supported operations from processor_zoo and predicate_zoo can be edited. Custom defined functions can not be created or modified in the web editor.

Compared to the gabrieltool Python library, the web editor provides better
visualization and is great for creating small FSMs. For more complicated FSMs,
consider using the gabrieltool for better reproducibility and efficiency.

Gabrieltool CLI (gbt)
-------------------------------------
The gabrieltool cli (gbt) provides a convenient method to launch a gabriel
server given an FSM, created by the python library or the web editor.

.. code-block:: console

    $ gbt run <path-to-fsm>
    $ # for usage details, see gbt -h