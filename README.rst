============================
OpenWorkflow
============================

--------------------------------------------------------------------------------
A suite of tools for creating wearable cognitive assistants.
--------------------------------------------------------------------------------


.. image:: https://img.shields.io/pypi/v/gabrieltool.svg
        :target: https://pypi.python.org/pypi/gabrieltool

.. image:: https://github.com/cmusatyalab/openworkflow/workflows/gabrieltool/badge.svg

.. image:: https://readthedocs.org/projects/openworkflow/badge/?version=latest
        :target: https://openworkflow.readthedocs.io/en/latest/
        :alt: Documentation Status


Tools for making wearable cognitive assistants. 

* Free software: Apache Software License 2.0
* Documentation: https://openworkflow.readthedocs.io.

Usage
--------

.. code-block:: bash

   $ git clone https://github.com/cmusatyalab/OpenWorkflow.git
   $ cd gabriel-tool 
   $ pip install -r requirements.txt
   $ python setup.py install

.. code-block:: python

   import gabrieltool

What's included?
----------------------

* `State Machine`_: Tools to create and persist state machines to describe a wearable cognitive assistant. 
* `Examples`_: Examples on how to use this tool.
* `State Machine Editor`_: A browser-based state machine editor, implemented in React. Give it a try at https://cmusatyalab.github.io/OpenWorkflow/
* `Gabriel Deployment Dashboard`_: A gabriel application deployment portal for wearable cognitive assistants that are built using this tool.

Generate Documentation
----------------------------------------------------------------

.. code-block::bash

   $ sphinx-apidoc -f -o docs/source gabrieltool
   $ cd docs
   $ make html

Credits
-------

This package was created with Cookiecutter_ and the `audreyr/cookiecutter-pypackage`_ project template.

.. _Cookiecutter: https://github.com/audreyr/cookiecutter
.. _`audreyr/cookiecutter-pypackage`: https://github.com/audreyr/cookiecutter-pypackage
.. _`State Machine`: gabrieltool/statemachine
.. _`Examples`: examples
.. _`examples/sandwich`: examples/sandwich
.. _`State Machine Editor`: gabrieltool/statemachine-editor-react
.. _`Gabriel Deployment Dashboard`: gabrieltool/dashboardmake html
