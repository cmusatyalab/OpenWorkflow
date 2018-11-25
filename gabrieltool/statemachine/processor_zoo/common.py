# -*- coding: utf-8 -*-
"""Simple Processors
"""

from __future__ import absolute_import, division, print_function


def dummy(img, **kwargs):
    return {'dummy_key': 'dummy_value'}


def tpod_dnn(img, **kwargs):
    raise NotImplementedError()
