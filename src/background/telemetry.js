/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * TODO: add desc.
 * @module
 */

const telemetry = {
  EVENT_CATEGORY: 'extension.price_alerts',
  events: {
    /**
     * User Events
     */
    // User clicks toolbar button to open the popup
    open_popup: {
      methods: ['open_popup'],
      objects: ['toolbar_button'],
      extra_keys: ['badge_type'],
    },
    // User clicks on a UI element opening a page in a new tab
    open_external_page: {
      methods: ['open_external_page'],
      objects: [
        'help_button',
        'feedback_button',
        'system_notification',
        'product_card',
        'amazon_link',
        'best_buy_link',
        'ebay_link',
        'home_depot_link',
        'walmart_link',
        'learn_more_link',
      ],
      // For objects of type 'system_notification' and 'product' only
      extra_keys: [
        'product_id',
        'price',
        'price_original',
      ],
    },
    // User adds a product to the product listing
    add_product: {
      methods: ['add_product'],
      objects: ['add_button'],
      extra_keys: ['product_id'],
    },
    // User deletes a product from the product listing
    delete_product: {
      methods: ['delete_product'],
      objects: ['delete_button'],
      extra_keys: ['product_id'],
    },
    // User undeletes a product from the product listing
    undo_delete_product: {
      methods: ['undo_delete_product'],
      objects: ['undo_button'],
      extra_keys: ['product_id'],
    },
    // User uninstalls the extension
    uninstall: {
      methods: ['uninstall'],
      objects: ['uninstall'],
      extra_keys: [],
    },
    // User hides the toolbar button for the extension
    hide_toolbar_button: {
      methods: ['hide_toolbar_button'],
      objects: ['toolbar_button'],
      extra_keys: [],
    },
    /**
     * Non-user Events
     */
    // Toolbar button is badged either due to a price alert or an extracted product
    badge_toolbar_button: {
      methods: ['badge_toolbar_button'],
      objects: ['toolbar_button'],
      extra_keys: ['badge_type'],
    },
    // System notification is sent notifying user of a price alert
    send_system_notice: {
      methods: ['send_system_notice'],
      objects: ['system_notification'],
      extra_keys: [
        'product_id',
        'price_original',
        'price',
      ],
    },
    // Product extraction is attempted on the content page
    attempt_extraction: {
      methods: ['attempt_extraction'],
      objects: ['page'],
      extra_keys: ['url'],
    },
    // Product extraction is completed on the content page
    complete_extraction: {
      methods: ['complete_extraction'],
      objects: ['page'],
      extra_keys: [
        'url',
        'method',
      ],
    },
  },
  async init() {
    await browser.telemetry.registerEvents(this.EVENT_CATEGORY, this.events);
  },
  async recordEvent(method, object, value, extra) {
    if (!browser.telemetry.canUpload()) {
      return;
    }
    try {
      await browser.telemetry.recordEvent(
        this.EVENT_CATEGORY,
        method,
        object,
        value,
        extra,
      );
    } catch (error) {
      throw new Error(`recordEvent failed with error: ${error}`);
    }
  },
};

export default telemetry;
