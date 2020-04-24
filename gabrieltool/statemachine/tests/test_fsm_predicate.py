# -*- coding: utf-8 -*-

"""Tests for `statemachine` predicates."""

import time
from gabrieltool.statemachine import predicate_zoo


def test_HasObjectClassWhileNotOthers():
    app_state = {
        'cat': [],
        'dog': []
    }
    has_classes = ['cat']
    absent_classes = ['mouse']
    predicate_obj = predicate_zoo.HasObjectClassWhileNotOthers(
        has_classes=has_classes, absent_classes=absent_classes)
    assert predicate_obj(app_state)

    has_classes = ['mouse', 'cat']
    absent_classes = ['elephant']
    predicate_obj = predicate_zoo.HasObjectClassWhileNotOthers(
        has_classes=has_classes, absent_classes=absent_classes)
    assert not predicate_obj(app_state)

    has_classes = ['cat']
    absent_classes = ['mouse', 'dog']
    predicate_obj = predicate_zoo.HasObjectClassWhileNotOthers(
        has_classes=has_classes, absent_classes=absent_classes)
    assert not predicate_obj(app_state)


def test_Wait():
    app_state = {}
    wait_time = 5
    predicate_obj = predicate_zoo.Wait(wait_time=5)
    assert not predicate_obj(app_state)
    time.sleep(1)
    assert not predicate_obj(app_state)
    time.sleep(1)
    assert not predicate_obj(app_state)
    time.sleep(3)
    assert predicate_obj(app_state)
    assert not predicate_obj(app_state)
    time.sleep(1)
    assert not predicate_obj(app_state)
