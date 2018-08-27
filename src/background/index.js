/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Entry point for the background script. Registers listeners for various
 * background tasks, such as extracting prices from webpages or alerting the
 * user of a new price alert.
 * @module
 */

import {
  BROWSER_ACTION_URL,
  FIRST_RUN_URL,
  PRICE_CHECK_TIMEOUT_INTERVAL,
} from 'commerce/config';
import {handleNotificationClicked, handlePriceAlerts} from 'commerce/background/price_alerts';
import {updateProductWithExtracted, updatePrices} from 'commerce/background/prices';
import store from 'commerce/state';
import {extractedProductShape} from 'commerce/state/products';
import {loadStateFromStorage} from 'commerce/state/sync';
import {validatePropType} from 'commerce/utils';

/**
 * Triggers background tasks when a product is extracted from a webpage. Along
 * with normal page navigation, this is also run when the prices are being
 * updated in the background.
 *
 * @param {ExtractedProduct} extracted
 * @param {MessageSender} sender
 *  The sender for the content script that extracted this product
 */
function handleExtractedProductData(extractedProduct, sender) {
  // Do nothing if the extracted product is missing fields.
  const result = validatePropType(extractedProduct, extractedProductShape);
  if (result !== undefined) {
    return;
  }

  // Update the toolbar icon's URL with the current page's product if we can
  if (sender.tab) {
    const url = new URL(BROWSER_ACTION_URL);
    url.searchParams.set('extractedProduct', JSON.stringify(extractedProduct));

    browser.browserAction.setPopup({
      popup: url.href,
      tabId: sender.tab.id,
    });
  }

  // Update saved product data if it exists
  updateProductWithExtracted(extractedProduct);
}

(async function main() {
  // Set browser action default badge color, which can't be set via manifest
  browser.browserAction.setBadgeBackgroundColor({color: '#24ba20'});

  // Setup product extraction listener
  browser.runtime.onMessage.addListener((message, sender) => {
    if (message.from === 'content' && message.subject === 'ready') {
      handleExtractedProductData(message.extractedProduct, sender);
    }
  });

  // Display price alerts when they are inserted into the state.
  store.subscribe(handlePriceAlerts);

  // Open the product page when an alert notification is clicked.
  browser.notifications.onClicked.addListener(handleNotificationClicked);

  // Enable content scripts now that the background listener is registered.
  // Store the return value globally to avoid destroying it, which would
  // unregister the content scripts.
  window.registeredContentScript = browser.contentScripts.register({
    matches: ['<all_urls>'],
    js: [
      {file: 'product_info.bundle.js'},
    ],
    runAt: 'document_idle',
    allFrames: true,
  });

  // Display first run page if we were just installed
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      browser.tabs.create({url: FIRST_RUN_URL});
    }
  });

  // Make sure the store is loaded before we check prices.
  await store.dispatch(loadStateFromStorage());

  // Update product prices while the extension is running, including once during
  // startup.
  updatePrices();
  setInterval(updatePrices, PRICE_CHECK_TIMEOUT_INTERVAL);
}());
