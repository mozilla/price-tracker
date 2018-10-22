/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Webpack configuration for building the webextension for deployment.
 * @module
 */

/* eslint-env node */
/* eslint-disable import/no-extraneous-dependencies */

const merge = require('webpack-merge');
const common = require('./common.config.js');

module.exports = merge(common, {
  mode: 'production',
});
