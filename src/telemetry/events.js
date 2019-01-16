/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Lists all events by data collection category to be recorded by the extension.
 * Which events are recorded and when can depend on this category (e.g.
 * category 1/2 versus category 3).
 * @module
 */

export const CATEGORY = 'extension.price_wise';

const DEFAULT_EXTRAS = [
  'tracked_prods',
  'privacy_dnt',
  'privacy_tp',
  'privacy_cookie',
];

const CATEGORY_1_AND_2_EVENTS = {
  // User clicks toolbar button to open the popup
  open_popup: {
    methods: ['open_popup'],
    objects: ['toolbar_button'],
    extra_keys: [
      'badge_type',
      ...DEFAULT_EXTRAS,
    ],
    record_on_release: true,
  },
  // User clicks on a UI element in the extension opening a non-product page in a new tab
  open_nonproduct_page: {
    methods: ['open_nonproduct_page'],
    objects: ['ui_element'],
    extra_keys: [
      'element',
      ...DEFAULT_EXTRAS,
    ],
    record_on_release: true,
  },
  // User clicks on a UI element in the extension opening a product page in a new tab
  open_product_page: {
    methods: ['open_product_page'],
    objects: ['product_card', 'system_notification'],
    extra_keys: [
      'price',
      'price_alert',
      'price_orig',
      'product_key',
      ...DEFAULT_EXTRAS,
      // For 'objects' value 'product_card' only
      'product_index',
      // For 'objects' value of 'system_notification' only
      'price_last_high',
    ],
    record_on_release: true,
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
    record_on_release: true,
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
    record_on_release: true,
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
    record_on_release: true,
  },
  // User hides the toolbar button for the extension
  hide_toolbar_button: {
    methods: ['hide_toolbar_button'],
    objects: ['toolbar_button'],
    extra_keys: [
      'badge_type',
      ...DEFAULT_EXTRAS,
    ],
    record_on_release: true,
  },
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
    record_on_release: true,
  },

  // Toolbar button is badged either due to a price alert or an extracted product
  badge_toolbar_button: {
    methods: ['badge_toolbar_button'],
    objects: ['toolbar_button'],
    extra_keys: [
      'badge_type',
      ...DEFAULT_EXTRAS,
    ],
    record_on_release: true,
  },
  // System notification is sent notifying user of a price alert
  send_notification: {
    methods: ['send_notification'],
    objects: ['system_notification'],
    extra_keys: [
      'price',
      'price_last_high',
      'price_orig',
      'product_key',
      ...DEFAULT_EXTRAS,
    ],
    record_on_release: true,
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
    record_on_release: true,
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
    record_on_release: true,
  },
};

export const CATEGORY_3_EVENTS = {};

export const EVENTS = {
  ...CATEGORY_1_AND_2_EVENTS,
  ...CATEGORY_3_EVENTS,
};
