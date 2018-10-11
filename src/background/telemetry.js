/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Registers and records telemetry scalars and events throughout the extension.
 * @module
 */

// Scalar category names can't have underscores
const CATEGORY = 'extension.pricealerts';

const SCALARS = {
  // Incremented when the user navigates to a supported site (e.g. Amazon)
  supported_sites: {
    kind: 'count',
    record_on_release: true,
  },
};

const EVENTS = {
  // User Events
  // User clicks toolbar button to open the popup
  open_popup: {
    methods: ['open_popup'],
    objects: ['toolbar_button'],
    extra_keys: [
      'badge_type',
      'tracked_prods',
    ],
  },
  // User clicks on a UI element in the extension opening a page in a new tab
  open_external_page: {
    methods: ['open_external_page'],
    objects: ['ui_element'],
    extra_keys: [
      'tracked_prods',
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
      'tracked_prods',
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
      'tracked_prods',
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
      'tracked_prods',
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
      'tracked_prods',
    ],
  },

  // Non-User Events
  // There is a price change on a tracked product
  detect_price_change: {
    methods: ['detect_price_change'],
    objects: ['product_page'],
    extra_keys: [
      'price',
      'price_orig',
      'product_key',
      'tracked_prods',
    ],
  },

  // Toolbar button is badged either due to a price alert or an extracted product
  badge_toolbar_button: {
    methods: ['badge_toolbar_button'],
    objects: ['toolbar_button'],
    extra_keys: [
      'badge_type',
      'tracked_prods',
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
      'tracked_prods',
    ],
  },
  // Product extraction is attempted on the content page
  attempt_extraction: {
    methods: ['attempt_extraction'],
    objects: ['product_page'],
    extra_keys: [
      'extraction_id',
      'is_bg_update',
      'tracked_prods',
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
      'tracked_prods',
    ],
  },
};

export async function registerProbes() {
  await browser.telemetry.registerScalars(CATEGORY, SCALARS);
  await browser.telemetry.registerEvents(CATEGORY, EVENTS);
}

export async function recordEvent(method, object, value, extra) {
  if (!browser.telemetry.canUpload()) {
    return;
  }
  await browser.telemetry.recordEvent(
    CATEGORY,
    method,
    object,
    value,
    extra,
  );
}

export async function scalarAdd(scalarName, value) {
  if (!browser.telemetry.canUpload()) {
    return;
  }
  await browser.telemetry.scalarAdd(
    `${CATEGORY}.${scalarName}`,
    value,
  );
}
