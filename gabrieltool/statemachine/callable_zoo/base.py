"""Base class and helper functions for callable classes.
"""
import inspect
from functools import wraps


def record_kwargs(func):
    """
    Decorator to automatically record constructor arguments

    >>> class process:
    ...     @record_kwargs
    ...     def __init__(self, cmd, reachable=False, user='root'):
    ...         pass
    >>> p = process('halt', True)
    >>> p.cmd, p.reachable, p.user
    ('halt', True, 'root')
    """
    names, varargs, keywords, defaults = inspect.getargspec(func)
    if defaults is None:
        defaults = ()

    @wraps(func)
    def wrapper(self, *args, **kargs):
        func(self, *args, **kargs)
        kwargs = {}
        for name, default in zip(reversed(names), reversed(defaults)):
            kwargs[name] = default
        for name, arg in list(zip(names[1:], args)) + list(kargs.items()):
            kwargs[name] = arg
        setattr(self, 'kwargs', kwargs)

    return wrapper


class CallableBase():
    """Base class for Callables used in FSMs.

    Custom callable classes need to inherit from this class. Inherited classes
    should add decorator @record_kwargs to their constructors for serialization.
    """

    def __init__(self):
        super().__init__()
        setattr(self, 'kwargs', {})

    @classmethod
    def from_json(cls, json_obj):
        """Create a CallableBase class instance from a json object.

        Subclasses should overide this class depending on the input type of
        their constructor.
        """
        return cls(**json_obj)

    def __eq__(self, other):
        if isinstance(other, CallableBase):
            return self.kwargs == other.kwargs
        return False

    def __ne__(self, other):
        return not self.__eq__(other)


class Null(CallableBase):
    """A empty callable class that returns None.

    Useful for initialization.
    """

    def __call__(self, *args, **kwargs):
        return None
