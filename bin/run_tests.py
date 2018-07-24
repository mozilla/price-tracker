#!/usr/bin/env python
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

"""
Runs automated JavaScript tests by launching Firefox in headless mode
and using the Marionette protocol to run the test code in Firefox.

This script relies on path modifications from npm and should be run
using the ``npm run test`` command.
"""

import os
import sys
from subprocess import check_call, PIPE, Popen, STDOUT
from tempfile import mkstemp

import click
from marionette_driver.marionette import Marionette


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


@click.command()
@click.option(
    '--firefox_bin',
    required=True,
    envvar='npm_package_config_firefox_bin',
    help='Path to Firefox binary',
)
def main(firefox_bin):
    if not firefox_bin:
        raise click.BadParameter(
            'No Firefox binary found; configure the path to Firefox with `npm config`.'
        )
    elif not os.path.exists(firefox_bin):
        raise click.BadParameter('Path to Firefox binary does not exist.')

    click.echo('== Building test bundle with Webpack')
    bundle_handle, bundle_path = mkstemp()
    try:
        webpack_config_path = os.path.join(ROOT, 'webpack.config.test.js')
        check_call([
            'webpack',
            '--bail',
            '--config', webpack_config_path,
            '--output', bundle_path,
        ])
        with open(bundle_path) as f:
            test_code = f.read()
    finally:
        os.remove(bundle_path)

    click.echo('== Running tests')
    client = None
    try:
        client = Marionette(bin=firefox_bin, headless=True)
        client.start_session()
        results = client.execute_async_script(test_code)
    finally:
        if client:
            client.cleanup()

    # Pipe output through formatter to make it readable.
    reporter_env = os.environ.copy()
    reporter_env.setdefault('TAP_COLORS', '1')  # Support color outpput
    reporter = Popen(
        ['tap-mocha-reporter', 'spec'],
        stdout=PIPE,
        stderr=STDOUT,
        stdin=PIPE,
        env=reporter_env,
    )
    formatted_output, stderr = reporter.communicate(results['output'])
    click.echo(formatted_output)

    # Exit with an error code if there were any failures
    if results['failures'] > 0:
        sys.exit(1)


if __name__ == '__main__':
    main()
