=========
gabrieltool
=========


.. image:: https://img.shields.io/pypi/v/gabrieltool.svg
        :target: https://pypi.python.org/pypi/gabrieltool

.. image:: https://img.shields.io/travis/junjuew/gabrieltool.svg
        :target: https://travis-ci.org/junjuew/gabrieltool

.. image:: https://readthedocs.org/projects/gabrieltool/badge/?version=latest
        :target: https://gabrieltool.readthedocs.io/en/latest/?badge=latest
        :alt: Documentation Status




Lightweight Wrapper Library to Make Matplotlib Better for Paper Plots.

Using ad-hoc one-time plotting scripts for paper figures lead to poor choices of
fonts, color, and are difficult to maintain. Moreover, every time a custom
plotting scripts are written, developers need to dig into matplotlib APIs to
tweak the correct knobs. We need a collection of reusable helper functions,
samples, and boilerplate code for common type of plots (e.g. CDF, histogram, bar
graph, line graph, figure with two axes) to make paper plotting easier and
faster. This thin lightweight wrapper library aims to solve this problem. Please
add feature you want to see to the list below.

* Free software: Apache Software License 2.0
* Documentation: https://gabrieltool.readthedocs.io.

Usage
--------

.. code-block:: bash

   $ pip install gabrieltool

.. code-block:: python

   import gabrieltool

Features & TODO List
----------------------

* Better defaults

   * [x] Time New Roman fonts
   * [x] pgd backend for plotting

* Samples

   * [ ] CDF
   * [ ] bar graph
   * [ ] line graph
   * [ ] two axes

* Data Management

   * [ ] plot data persistence

Credits
-------

This package was created with Cookiecutter_ and the `audreyr/cookiecutter-pypackage`_ project template.

.. _Cookiecutter: https://github.com/audreyr/cookiecutter
.. _`audreyr/cookiecutter-pypackage`: https://github.com/audreyr/cookiecutter-pypackage
