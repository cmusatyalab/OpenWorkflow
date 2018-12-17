# -*- coding: utf-8 -*-
"""Processing Function on State Machine Inputs.
"""


def has_obj_cls(app_state, cls_name):
    return (cls_name in app_state)


def always(app_state):
    return True


def tpod_dnn(img, **kwargs):
    print('tpod_dnn called!')
