/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Things related to the browser action that have to run in the background
 * script.
 * @module
 */

import store from 'commerce/state';
import {deactivateAllAlerts} from 'commerce/state/prices';
import {removeMarkedProducts} from 'commerce/state/products';

/**
 * Triggered when the browser action panel opens, this registers a handler to
 * detect when the panel is closed and perform some cleanup.
 *
 * Running these state changes in the background script avoids issues with
 * making state changes or sending messages from a JS context that is being
 * unloaded.
 */
export function handleBrowserActionOpened(message, port) {
  port.onDisconnect.addListener(() => {
    store.dispatch(removeMarkedProducts());
    store.dispatch(deactivateAllAlerts());
  });
}
