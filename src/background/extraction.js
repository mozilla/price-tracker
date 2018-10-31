/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Functions to support product extraction.
 * @module
 */

import config from 'commerce/config';
import {updateProductWithExtracted} from 'commerce/background/price_updates';
import {isValidExtractedProduct} from 'commerce/state/products';
import {recordEvent} from 'commerce/telemetry/extension';

/**
 * Triggers background tasks when a product is extracted from a webpage. Along
 * with normal page navigation, this is also run when the prices are being
 * updated in the background.
 *
 * @param {object} message
 * @param {MessageSender} sender
 *  The sender for the content script that extracted this product
 */
export async function handleExtractedProductData({extractedProduct, sendTelemetry = true}, sender) {
  // Do nothing if the extracted product isn't valid.
  if (!isValidExtractedProduct(extractedProduct)) {
    return;
  }

  if (sender.tab) {
    const tabId = sender.tab.id;

    // Update the toolbar icon's URL with the current page's product if we can
    const url = new URL(await config.get('browserActionUrl'));
    url.searchParams.set('extractedProduct', JSON.stringify(extractedProduct));

    // Update the toolbar popup if it is open with the current page's product
    if (sender.tab.active) {
      try {
        await browser.runtime.sendMessage({
          subject: 'extracted-product',
          extractedProduct,
        });
      } catch (error) {
        // Popup must be closed
      }
    }

    browser.browserAction.setPopup({popup: url.href, tabId});
    browser.browserAction.setBadgeBackgroundColor({
      color: await config.get('badgeDetectBackground'),
      tabId,
    });
    browser.browserAction.setBadgeText({text: '✚', tabId});
    if (sendTelemetry) {
      await recordEvent('badge_toolbar_button', 'toolbar_button', null, {
        badge_type: 'add',
      });
    }
  }

  // Update saved product data if it exists
  updateProductWithExtracted(extractedProduct);
}

/**
 * Resets the browser action and re-triggers extraction when the History API is
 * used to change a tab's URL.
 * @param {object} details
 */
export async function handleHistoryStateUpdated({tabId}) {
  if (tabId) {
    browser.browserAction.setPopup({popup: null, tabId});
    browser.browserAction.setBadgeBackgroundColor({color: null, tabId});
    browser.browserAction.setBadgeText({text: null, tabId});
    await browser.tabs.sendMessage(tabId, {type: 'reextract-product'});
  }
}
