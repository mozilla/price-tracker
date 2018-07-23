/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Entry point for the automated test suite. This script is run inside a
 * content-scoped sandbox in Firefox by Marionette. See bin/run_tests.py for
 * more info.
 */

// marionetteScriptFinished is a wrapper added during the webpack build that
// returns a value to run_tests.py and ends execution.
/* global marionetteScriptFinished */

import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import test from 'tape';

// Configure testing libraries
Enzyme.configure({ adapter: new Adapter() });

// Collect formatted output and count failures.
let output = '';
let failures = 0;
test.createStream()
  .on('data', (data) => {
    output += data;
  }).on('end', () => {
    // Send the results back to run_tests.py
    marionetteScriptFinished({output, failures});
  });
test.onFailure(() => failures++);

// Import all files within the tests directory that have the word "test"
// in their filename.
const requireTest = require.context('.', true, /test.*\.jsx?$/);
requireTest.keys().forEach(requireTest);
