#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""The setup script."""

from setuptools import setup, find_packages

with open('README.rst') as readme_file:
    readme = readme_file.read()

with open('HISTORY.rst') as history_file:
    history = history_file.read()

requirements = [
    'pip>=20',
    'setuptools>=46',
    'tensorflow-serving-api~=1.15',
    'docker',
    'opencv-python>=3',
    'logzero',
    'fire',
    'gabriel-server',
]

setup_requirements = []

test_requirements = ['pytest', ]

setup(
    author="Junjue Wang",
    author_email='junjuew@cs.cmu.edu',
    classifiers=[
        'Development Status :: 2 - Pre-Alpha',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: Apache Software License',
        'Natural Language :: English',
        'Programming Language :: Python :: 3.5',
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7',
    ],
    python_requires=">=3.5, <3.8",
    description="Tools for Making Wearable Cognitive Assitants",
    install_requires=requirements,
    license="Apache Software License 2.0",
    long_description=readme + '\n\n' + history,
    include_package_data=True,
    keywords='gabrieltool',
    name='gabrieltool',
    packages=find_packages(),
    setup_requires=setup_requirements,
    test_suite='tests',
    tests_require=test_requirements,
    url='https://github.com/junjuew/gabriel-tool',
    version='1.0.0',
    zip_safe=False,
)
