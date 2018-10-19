/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import config from 'commerce/config';
import {recordEvent, getBadgeType} from 'commerce/background/telemetry';

/**
 * Listeners for messages from content scripts and browserAction scripts to the background page.
 * @module
 */

/**
 * Listener for messages from content scripts to fetch config values.
 */
export async function handleConfigMessage({name}) {
  return config.get(name);
}

/**
 * Listener for messages from content and browserAction scripts to record telemetry events.
 */
export async function handleTelemetryMessage({method, object, value, extra}) {
  recordEvent(method, object, value, (method === 'open_popup') ? {badge_type: await getBadgeType()} : extra);
}
