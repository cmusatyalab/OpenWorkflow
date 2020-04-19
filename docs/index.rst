OpenWorkflow Documentation
======================================

In addition to creating DNN-based object detectors, developers need to write
custom logic to implement the WCA task model running on the cloudlet. In this
section, we introduce Open- Workflow, an FSM authoring tool that provides a
Python library and a GUI to enable fast implementation to allow for quick
development iteration. As discussed in Section 6.2.2, the WCA cloudlet logic can
be represented as a finite state machine. The FSM representation allows us to
impose structure and provide tools for task model implementation. OpenWorkflow
consists of a web GUI that allows users to visualize and edit a WCA FSM within a
browser, a python library that supports the creation and execution of a FSM, and
a binary file format that efficiently stores the FSM. The OpenWorkflow video
demo can be found at https://youtu.be/L9ugONLpnwc.

User Guide
------------

.. toctree::
   :maxdepth: 2
   :caption: Contents:

   readme
   installation
   usage
   modules
   contributing
   authors
   history

API
-----------
.. automodule:: gabrieltool.statemachine.fsm
    :members:

Features
--------

- Provide a finite state machine abstraction for creating wearable cognitive assistants.

Installation
------------

Install $project by running:

    pip install openworkflow

Contribute
----------

- Issue Tracker: github.com/cmusatyalab/OpenWorkflow/issues
- Source Code: github.com/cmusatyalab/OpenWorkflow

Support
-------

If you are having issues, please let us know.
We have a mailing list located at: project@google-groups.com

License
-------

The project is licensed under the BSD license.

Indices and tables
==================
* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
