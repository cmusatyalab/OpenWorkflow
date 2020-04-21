# -*- coding: utf-8 -*-
"""Callable classes for Transition Predicates.

All the classes here should be a callable and return either True/False when
called (to indicate whether or not to take a transition). All classes should
inherit from CallableBase class and annoate their constructor (if there is one)
with the @record_kwargs decorator for proper serialization.
"""

from gabrieltool.statemachine.callable_zoo import record_kwargs
from gabrieltool.statemachine.callable_zoo import CallableBase


class HasObjectClass(CallableBase):
    """Check if there is an object class in the extracted information of the sensor data.
    """

    @record_kwargs
    def __init__(self, class_name):
        """Constructor.

        Args:
            class_name (string): Class name or id.
        """
        super().__init__()
        self.class_name = class_name

    def __call__(self, app_state):
        return self.class_name in app_state


class Always(CallableBase):
    """Always take this transition.

    Useful for welcome message when the application starts.
    """

    def __call__(self, app_state):
        return True
