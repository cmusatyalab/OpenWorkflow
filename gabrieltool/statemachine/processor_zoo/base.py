
# -*- coding: utf-8 -*-
"""Abstract base classes for processors
"""


class StatefulProcessor(object):
    """Represent a stateful processor.

    A stateful processor's context needs to be initialized when running.
    """
    def init():
        raise NotImplementedError()

    def clean():
        raise NotImplementedError()
