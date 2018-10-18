/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Communication from content scripts to the background page for fetching config
 * values.
 * @module
 */

export default {
  async get(configName) {
    return browser.runtime.sendMessage({type: 'config', name: configName});
  },
};
