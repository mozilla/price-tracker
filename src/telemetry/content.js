/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Communication from content scripts to the background page for recording
 * telemetry events.
 * @module
 */

export default async function recordEvent(method, object, value = null, extra = null) {
  await browser.runtime.sendMessage({
    type: 'telemetry',
    data: {
      method,
      object,
      value,
      extra,
    },
  });
}
