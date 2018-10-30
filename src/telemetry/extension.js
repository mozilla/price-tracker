/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Registers and records telemetry events throughout the extension.
 * @module
 */

import {shouldCollectTelemetry} from 'commerce/privacy';
import store from 'commerce/state';
import {getAllProducts} from 'commerce/state/products';

const CATEGORY = 'extension.price_alerts';

const DEFAULT_EXTRAS = [
  'tracked_prods',
  'privacy_dnt',
  'privacy_tp',
  'privacy_cookie',
];

const EVENTS = {
  // User Events
  // User visits a supported site
  visit_supported_site: {
    methods: ['visit_supported_site'],
    objects: ['supported_site'],
    extra_keys: [
      ...DEFAULT_EXTRAS,
    ],
  },

  // User clicks toolbar button to open the popup
  open_popup: {
    methods: ['open_popup'],
    objects: ['toolbar_button'],
    extra_keys: [
      'badge_type',
      ...DEFAULT_EXTRAS,
    ],
  },
  // User clicks on a UI element in the extension opening a page in a new tab
  open_external_page: {
    methods: ['open_external_page'],
    objects: ['ui_element'],
    extra_keys: [
      ...DEFAULT_EXTRAS,
      'element',
      // For 'element' values 'product_card' and 'system_notification' only
      'price',
      'price_alert',
      'price_orig',
      'product_key',
      // For 'element' value 'product_card' only
      'product_index',
    ],
  },
  // User adds a product to the product listing
  add_product: {
    methods: ['add_product'],
    objects: ['add_button'],
    extra_keys: [
      'price',
      'product_key',
      ...DEFAULT_EXTRAS,
    ],
  },
  // User deletes a product from the product listing
  delete_product: {
    methods: ['delete_product'],
    objects: ['delete_button'],
    extra_keys: [
      'price',
      'price_alert',
      'price_orig',
      'product_index',
      'product_key',
      ...DEFAULT_EXTRAS,
    ],
  },
  // User undeletes a product from the product listing
  undo_delete_product: {
    methods: ['undo_delete_product'],
    objects: ['undo_button'],
    extra_keys: [
      'price',
      'price_alert',
      'price_orig',
      'product_index',
      'product_key',
      ...DEFAULT_EXTRAS,
    ],
  },
  // User uninstalls the extension
  uninstall: {
    methods: ['uninstall'],
    objects: ['uninstall'],
    extra_keys: ['tracked_prods'],
  },
  // User hides the toolbar button for the extension
  hide_toolbar_button: {
    methods: ['hide_toolbar_button'],
    objects: ['toolbar_button'],
    extra_keys: [
      'badge_type',
      ...DEFAULT_EXTRAS,
    ],
  },

  // Non-User Events
  // There is a price change on a tracked product
  detect_price_change: {
    methods: ['detect_price_change'],
    objects: ['product_page'],
    extra_keys: [
      'price',
      'price_prev',
      'price_orig',
      'product_key',
      ...DEFAULT_EXTRAS,
    ],
  },

  // Toolbar button is badged either due to a price alert or an extracted product
  badge_toolbar_button: {
    methods: ['badge_toolbar_button'],
    objects: ['toolbar_button'],
    extra_keys: [
      'badge_type',
      ...DEFAULT_EXTRAS,
    ],
  },
  // System notification is sent notifying user of a price alert
  send_notification: {
    methods: ['send_notification'],
    objects: ['system_notification'],
    extra_keys: [
      'price',
      'price_orig',
      'product_key',
      ...DEFAULT_EXTRAS,
    ],
  },
  // Product extraction is attempted on the content page
  attempt_extraction: {
    methods: ['attempt_extraction'],
    objects: ['product_page'],
    extra_keys: [
      'extraction_id',
      'is_bg_update',
      ...DEFAULT_EXTRAS,
    ],
  },
  // Product extraction is completed on the content page
  complete_extraction: {
    methods: ['complete_extraction'],
    objects: ['product_page'],
    extra_keys: [
      'extraction_id',
      'is_bg_update',
      'method',
      ...DEFAULT_EXTRAS,
    ],
  },
};

export async function registerEvents() {
  await browser.telemetry.registerEvents(CATEGORY, EVENTS);
}

export async function recordEvent(method, object, value, extraBase = {}) {
  if (!browser.telemetry.canUpload() || !(await shouldCollectTelemetry())) {
    return;
  }

  // Append extra keys that are sent with all events
  const extra = {
    ...extraBase,
    tracked_prods: getAllProducts(store.getState()).length,
    privacy_dnt: navigator.doNotTrack === '1',
    privacy_tp: (await browser.privacy.websites.trackingProtectionMode.get({})).value,
    privacy_cookie: (await browser.privacy.websites.cookieConfig.get({})).value.behavior,
  };

  // Convert all extra key values to strings as required by event telemetry
  for (const [extraKey, extraValue] of Object.entries(extra)) {
    extra[extraKey] = extraValue.toString();
  }

  await browser.telemetry.recordEvent(
    CATEGORY,
    method,
    object,
    value,
    extra,
  );
}

// Get the tabId for the currently focused tab in the currently focused window.
async function getActiveTabId() {
  const windowId = (await browser.windows.getCurrent()).id;
  return (
    (await browser.tabs.query({
      windowId,
      active: true,
    }))[0].id
  );
}

export async function getBadgeType() {
  const activeTabId = await getActiveTabId();
  const badgeText = await browser.browserAction.getBadgeText(
    activeTabId ? {tabId: activeTabId} : {},
  );
  switch (true) {
    case (badgeText === ''):
      return 'none';
    case (badgeText === '✚'):
      return 'add';
    case (/\d+/.test(badgeText)):
      return 'price_alert';
    default:
      console.warn(`Unexpected badge text ${badgeText}.`); // eslint-disable-line no-console
      return 'unknown';
  }
}

export async function handleWidgetRemoved(widgetId) {
  const addonId = (await browser.management.getSelf()).id;
  // widgetId replaces '@' and '.' in the addonId with _
  const modifiedAddonId = addonId.replace(/[@.+]/g, '_');
  if (`${modifiedAddonId}-browser-action` === widgetId) {
    await recordEvent('hide_toolbar_button', 'toolbar_button', null, {
      badge_type: await getBadgeType(),
    });
  }
}

/**
 * Log telemetry events sent from content scripts.
 * @param {object} message
 */
export async function handleTelemetryMessage(message) {
  return recordEvent(
    message.method,
    message.object,
    message.value,
    message.extra,
  );
}
