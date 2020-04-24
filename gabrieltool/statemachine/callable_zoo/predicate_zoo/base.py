# -*- coding: utf-8 -*-
"""Callable classes for Transition Predicates.

All the classes here should be a callable and return either True/False when
called (to indicate whether or not to take a transition). All classes should
inherit from CallableBase class and annoate their constructor (if there is one)
with the @record_kwargs decorator for proper serialization.
"""
import time

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


class HasObjectClassWhileNotOthers(CallableBase):
    """Check if there are some object classes in the extracted information while some other classes are not.
    """

    @record_kwargs
    def __init__(self, has_classes=None, absent_classes=None):
        """Constructor.

        Args:
            existed_classes (list of strings, optional): Names of classes that
                need to exist. Defaults to None.
            absent_classes (list of strings, optional): Name of classes that
                need to be absent. Defaults to None.
        """
        super().__init__()
        self.has_classes = has_classes if has_classes is not None else []
        self.absent_classes = absent_classes if absent_classes is not None else []

    def __call__(self, app_state):
        return all(
            [class_name in app_state for class_name in self.has_classes]) and all(
                [class_name not in app_state for class_name in self.absent_classes]
        )


class Wait(CallableBase):
    """Wait for some time before turning true.
    """

    @record_kwargs
    def __init__(self, wait_time=None):
        """Constructor.

        Args:
            wait_time (int, optional): Wait time in seconds. Defaults to None.
        """
        super().__init__()
        self.wait_time = wait_time
        # set when this predicate this first called
        # or returned True in the last call.
        self._start_time = None

    def __call__(self, app_state):
        if self._start_time is None:
            self._start_time = time.time()
        else:
            cur_time = time.time()
            if (cur_time - self._start_time) > self.wait_time:
                # reset
                self._start_time = None
                return True
        return False
