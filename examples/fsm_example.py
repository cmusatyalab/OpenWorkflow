# -*- coding: utf-8 -*-
"""Simple example of using gabrieltool.statemachine.
"""

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

# save to disk
with open('simple.pbfsm', 'wb') as f:
    f.write(fsm.StateMachine.to_bytes(
        name='simple_fsm',
        start_state=st_start
    ))
