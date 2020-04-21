# -*- coding: utf-8 -*-
"""Processing Function on State Machine Inputs.
"""

from gabrieltool.statemachine.callable_zoo import record_kwargs
from gabrieltool.statemachine.callable_zoo import CallableBase


class HasObjectClass(CallableBase):

    @record_kwargs
    def __init__(self, class_name):
        super().__init__()
        self.class_name = class_name

    def __call__(self, app_state):
        return self.class_name in app_state


class Always(CallableBase):

    def __call__(self, app_state):
        return True
