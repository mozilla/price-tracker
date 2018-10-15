/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/* eslint-disable no-unused-vars */

/**
 * Config values that are shared between files or otherwise useful to have in
 * a separate file. Config values can be overridden by setting a pref at the
 * subtree extensions.shopping@mozilla.org.prefName.
 *
 * Content scripts cannot access the preference API, and thus cannot use this
 * module to get config values. Use commerce/config/content instead to use
 * message passing to fetch the config values from the background script.
 * @module
 */

class Value {
  constructor(defaultValue) {
    this.defaultValue = defaultValue;
  }

  async get(name) {
    throw new Error('The Value config class cannot be used directly; use a type-specific subclass.');
  }
}

class StringValue extends Value {
  async get(name) {
    return browser.shoppingPrefs.getCharPref(name, this.defaultValue);
  }
}

class IntValue extends Value {
  async get(name) {
    return browser.shoppingPrefs.getIntPref(name, this.defaultValue);
  }
}

class BoolValue extends Value {
  async get(name) {
    return browser.shoppingPrefs.getBoolPref(name, this.defaultValue);
  }
}

class ListValue extends Value {
  async get(name) {
    const prefValue = await browser.shoppingPrefs.getCharPref(name, this.defaultValue.join(','));
    return prefValue.split(',');
  }
}

const CONFIG = {
  /** Time to wait between price checks for a product */
  priceCheckInterval: new IntValue(1000 * 60 * 60 * 6), // 6 hours

  /** Time to wait between checking if we should fetch new prices */
  priceCheckTimeoutInterval: new IntValue(1000 * 60 * 15), // 15 minutes

  /** Delay before removing iframes created during price checks */
  iframeTimeout: new IntValue(1000 * 60), // 1 minute

  // URLs to files within the extension
  browserActionUrl: new StringValue(browser.extension.getURL('/browser_action/index.html')),

  // Price alert config
  alertPercentThreshold: new IntValue(5), // 5%
  alertAbsoluteThreshold: new IntValue(1000), // $10

  /** Color of the toolbar badge for showing active price alerts. */
  badgeAlertBackground: new StringValue('#00FEFF'),

  /** Color of the toolbar badge when a product on the current page is trackable. */
  badgeDetectBackground: new StringValue('#33F70C'),

  /** URL for the add-on's page on support.mozilla.org */
  supportUrl: new StringValue('https://support.mozilla.org'),

  /** URL for the add-on's feedback form */
  feedbackUrl: new StringValue('https://www.mozilla.org'),

  /** List of domains that extraction is performed on. */
  extractionAllowlist: new ListValue([
    'amazon.com',
    'www.amazon.com',
    'smile.amazon.com',
    'bestbuy.com',
    'www.bestbuy.com',
    'ebay.com',
    'www.ebay.com',
    'homedepot.com',
    'www.homedepot.com',
    'walmart.com',
    'www.walmart.com',
    'mkelly.me',
    'www.mkelly.me',
  ]),
};

export default {
  async get(configName) {
    const value = CONFIG[configName];
    if (!value) {
      throw new Error(`Invalid config ${configName}`);
    }

    return value.get(configName);
  },
};
