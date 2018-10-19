/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Entry point for the background script. Registers listeners for various
 * background tasks, such as extracting prices from webpages or alerting the
 * user of a new price alert.
 * @module
 */

import config from 'commerce/config';
import {handleConnect, handleMessage} from 'commerce/background/messages';
import {handleNotificationClicked, handlePriceAlerts} from 'commerce/background/price_alerts';
import {handleWebRequest, updatePrices} from 'commerce/background/price_updates';
import store from 'commerce/state';
import {checkMigrations} from 'commerce/state/migrations';
import {loadStateFromStorage} from 'commerce/state/sync';
import {registerEvents} from 'commerce/background/telemetry';

(async function main() {
  registerEvents();

  // Set browser action default badge color, which can't be set via manifest
  browser.browserAction.setBadgeBackgroundColor({
    color: await config.get('badgeAlertBackground'),
  });

  // Register centralized message handlers
  browser.runtime.onMessage.addListener(handleMessage);
  browser.runtime.onConnect.addListener(handleConnect);

  // Display price alerts when they are inserted into the state.
  // This includes the initial load from extension storage below.
  store.subscribe(handlePriceAlerts);

  // Open the product page when an alert notification is clicked.
  browser.notifications.onClicked.addListener(handleNotificationClicked);

  // Enable content scripts now that the background listener is registered.
  // Store the return value globally to avoid destroying it, which would
  // unregister the content scripts.
  window.registeredContentScript = browser.contentScripts.register({
    matches: ['<all_urls>'],
    js: [
      {file: 'extraction.bundle.js'},
    ],
    runAt: 'document_end',
    allFrames: true,
  });

  // Set up web request listener to modify framing headers for background updates
  const webRequestFilter = {
    urls: ['<all_urls>'],
    types: ['sub_frame'],
    tabId: browser.tabs.TAB_ID_NONE,
  };
  browser.webRequest.onHeadersReceived.addListener(
    handleWebRequest,
    webRequestFilter,
    ['blocking', 'responseHeaders'],
  );

  // Make sure the store is loaded before we check prices.
  await store.dispatch(loadStateFromStorage());

  // Now that the state is loaded, check for migrations and apply them if
  // necessary.
  store.dispatch(checkMigrations());

  // Update product prices while the extension is running, including once during
  // startup.
  updatePrices();
  setInterval(updatePrices, await config.get('priceCheckTimeoutInterval'));
}());
