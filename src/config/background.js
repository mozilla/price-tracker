/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import config from 'commerce/config';

/**
 * Listener for messages from content scripts to the background page to fetch
 * config values.
 * @module
 */

export async function handleConfigMessage(message) {
  return config.get(message.name);
}
