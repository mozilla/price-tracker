/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Registers and records telemetry scalars and events throughout the extension.
 * @module
 */

const telemetry = {
  // Scalar category names can't have underscores
  CATEGORY: 'extension.pricealerts',
  scalars: {
    // Incremented when the user navigates to a supported site (e.g. Amazon)
    supported_sites: {
      kind: 'count',
      record_on_release: true,
    },
  },
  events: {
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
    // User clicks on a UI element opening a page in a new tab
    open_external_page: {
      methods: ['open_external_page'],
      objects: [
        'amazon_link',
        'best_buy_link',
        'ebay_link',
        'feedback_button',
        'help_button',
        'home_depot_link',
        'learn_more_link',
        'product_card',
        'system_notification',
        'walmart_link',
      ],
      // For objects of type 'system_notification' and 'product' only ('tracked_prods' excepted)
      extra_keys: [
        'price',
        'price_alert',
        'price_orig',
        'product_index',
        'product_key',
        'tracked_prods',
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
  },
  async registerProbes() {
    await browser.telemetry.registerScalars(this.CATEGORY, this.scalars);
    await browser.telemetry.registerEvents(this.CATEGORY, this.events);
  },
  async recordEvent(method, object, value, extra) {
    if (!browser.telemetry.canUpload()) {
      return;
    }
    await browser.telemetry.recordEvent(
      this.CATEGORY,
      method,
      object,
      value,
      extra,
    );
  },
  async scalarAdd(scalarName, value) {
    await browser.telemetry.scalarAdd(
      `${this.CATEGORY}.${scalarName}`,
      value,
    );
  },
};

export default telemetry;
