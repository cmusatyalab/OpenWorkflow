"""A collection of Callable classes to be used by Processors (in FSM states).
"""
from .base import DummyCallable, FasterRCNNOpenCVCallable  # noqa: F401
from .containerized import FasterRCNNContainerCallable  # noqa: F401
from .containerized import TFServingContainerCallable  # noqa: F401
