/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * UI functions for displaying a price alert to a user. For the state-related
 * price alert code, see src/state/prices.js.
 * @module
 */

import Dinero from 'dinero.js';

import store from 'commerce/state';
import {
  deactivateAlert,
  getActivePriceAlerts,
  getLatestPriceForProduct,
  getOldestPriceForProduct,
  getPrice,
  getPriceAlertForPrice,
  showPriceAlert,
} from 'commerce/state/prices';
import {getProduct} from 'commerce/state/products';
import {getVendor} from 'commerce/state/vendors';
import {recordEvent} from 'commerce/telemetry/extension';

/**
 * Update the extension UI based on the current state of active price alerts.
 * Should be called whenever price alerts may have changed.
 */
export async function handlePriceAlerts() {
  const state = store.getState();
  const activeAlerts = getActivePriceAlerts(state);

  // Show the browser action badge if there are any active alerts.
  if (activeAlerts.length > 0) {
    browser.browserAction.setBadgeText({text: `${activeAlerts.length}`});
    await recordEvent('badge_toolbar_button', 'toolbar_button', null, {
      badge_type: 'price_alert',
    });
  } else {
    browser.browserAction.setBadgeText({text: null});
  }

  for (const alert of activeAlerts) {
    // Only notify for un-shown alerts.
    if (alert.shown) {
      continue;
    }

    const alertPrice = getPrice(state, alert.priceId);
    const product = getProduct(state, alert.productId);
    const originalPrice = getOldestPriceForProduct(state, alert.productId);
    const highPriceAmount = Dinero({amount: alert.highPriceAmount});
    const vendor = getVendor(state, product.url);
    const vendorName = vendor ? vendor.name : new URL(product.url).hostname;

    // Display notification
    const original = originalPrice.amount.toFormat('$0.00');
    const high = highPriceAmount.toFormat('$0.00');
    const now = alertPrice.amount.toFormat('$0.00');
    browser.notifications.create(alert.priceId, {
      type: 'basic',
      title: `Price Alert: ${product.title}`,
      message: `${vendorName} · Originally ${original}, high of ${high}, now ${now}`,
    });
    await recordEvent('send_notification', 'system_notification', null, { // eslint-disable-line no-await-in-loop
      price: alertPrice.amount.getAmount(),
      price_last_high: highPriceAmount.getAmount(),
      price_orig: originalPrice.amount.getAmount(),
      product_key: product.anonId,
    });

    // Update state now that we've shown it
    store.dispatch(showPriceAlert(alert));
  }
}

/**
 * Deactivate the price alert and open the product page when a price alert
 * notification is clicked. Should be passed to
 * browser.notifications.onClicked.addListener.
 *
 * @param {string} notificationId
 *  The ID assigned to the notification. This is equal to the priceId of the
 *  alert that triggered the notification.
 */
export async function handleNotificationClicked(notificationId) {
  const state = store.getState();
  const alert = getPriceAlertForPrice(state, notificationId);
  if (alert) {
    const product = getProduct(state, alert.productId);
    browser.tabs.create({url: product.url});

    // Record open_external_page event
    const latestPrice = getLatestPriceForProduct(state, product.id);
    const originalPrice = getOldestPriceForProduct(state, product.id);
    const highPriceAmount = Dinero({amount: alert.highPriceAmount});
    await recordEvent('open_external_page', 'ui_element', null, {
      element: 'system_notification',
      price: latestPrice.amount.getAmount(),
      price_alert: alert.active,
      price_last_high: highPriceAmount.getAmount(),
      price_orig: originalPrice.amount.getAmount(),
      product_key: product.anonId,
    });

    // Mark the alert as inactive if necessary, since it was followed.
    if (alert.active) {
      store.dispatch(deactivateAlert(alert));
    }
  }
}
