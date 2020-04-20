.. highlight:: shell

Contributing
**********************

Contributions are welcome, and they are greatly appreciated! Every little bit
helps, and credit will always be given.

You can contribute in many ways:

Types of Contributions
----------------------

Report Bugs
~~~~~~~~~~~

Report bugs at https://github.com/cmusatyalab/OpenWorkflow/issues.

If you are reporting a bug, please include:

* Your operating system name and version.
* Any details about your local setup that might be helpful in troubleshooting.
* Detailed steps to reproduce the bug.

Fix Bugs
~~~~~~~~

Look through the GitHub issues for bugs. Anything tagged with "bug" and "help
wanted" is open to whoever wants to implement it.

Implement Features
~~~~~~~~~~~~~~~~~~

Look through the GitHub issues for features. Anything tagged with "enhancement"
and "help wanted" is open to whoever wants to implement it.

Write Documentation
~~~~~~~~~~~~~~~~~~~

OpenWorkflow could always use more documentation, whether as part of the
official OpenWorkflow docs, in docstrings, or even on the web in blog posts,
articles, and such.

Submit Feedback
~~~~~~~~~~~~~~~

The best way to send feedback is to file an issue at https://github.com/cmusatyalab/OpenWorkflow/issues.

If you are proposing a feature:

* Explain in detail how it would work.
* Keep the scope as narrow as possible, to make it easier to implement.
* Remember that this is a volunteer-driven project, and that contributions
  are welcome :)

Get Started!
------------

Ready to contribute? Here's how to set up `OpenWorkflow` for local development.

1. Fork the `OpenWorkflow` repo on GitHub.
2. Clone your fork locally::

    $ git clone git@github.com:your_name_here/gabrieltool.git

3. Install your local copy into a virtualenv::

    $ python3 -m venv env
    $ . env/bin/activate
    $ cd gabrieltool/
    $ pip install -r requirements/dev.txt
    $ python setup.py install

4. Create a branch for local development::

    $ git checkout -b name-of-your-bugfix-or-feature

   Now you can make your changes locally.

5. When you're done making changes, check that your changes pass linter (autopep8) and the
   tests::

    $ python -m pytest <directory>

6. Commit your changes and push your branch to GitHub::

    $ git add .
    $ git commit -m "Your detailed description of your changes."
    $ git push origin name-of-your-bugfix-or-feature

7. Submit a pull request through the GitHub website.

Pull Request Guidelines
-----------------------

Before you submit a pull request, check that it meets these guidelines:

1. The pull request should include tests.
2. If the pull request adds functionality, the docs should be updated. Put
   your new functionality into a function with a docstring.
3. The pull request should work for Python 3.5, 3.6, and 3.7. Check
   https://github.com/cmusatyalab/OpenWorkflow/actions
   and make sure that the tests pass for all supported Python versions.


Deploying
---------

A reminder for the maintainers on how to deploy.
Make sure all your changes are committed (including an entry in HISTORY.rst).
Then run::

$ bump2version patch # possible: major / minor / patch
$ git push origin <tag_name>

[This Github
workflow](https://github.com/cmusatyalab/OpenWorkflow/blob/master/.github/workflows/pythonpackage.yml.yml)
will then deploy to PyPI if tests pass.


Generate Documentation
----------------------------------------------------------------

.. code-block::bash

    $ sphinx-apidoc -f -o docs/source gabrieltool
    $ cd docs
    $ make html