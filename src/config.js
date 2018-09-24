/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Config values that are shared between files or otherwise useful to have in
 * a separate file. Config values can be overridden by setting a pref at the
 * subtree extensions.shopping@mozilla.org.prefName.
 * @module
 */

const DEFAULTS = {
  /** Time to wait between price checks for a product */
  priceCheckInterval: 1000 * 60 * 60 * 6, // 6 hours

  /** Time to wait between checking if we should fetch new prices */
  priceCheckTimeoutInterval: 1000 * 60 * 15, // 15 minutes

  /** Delay before removing iframes created during price checks */
  iframeTimeout: 1000 * 60, // 1 minute

  // URLs to files within the extension
  browserActionUrl: browser.extension.getURL('/browser_action/index.html'),

  // Price alert config
  alertPercentThershold: 5, // 5%
  alertAbsoluteThreshold: 1000, // $10

  /** Color of the toolbar badge for showing active price alerts. */
  badgeAlertBackground: '#00FEFF',

  /** Color of the toolbar badge when a product on the current page is trackable. */
  badgeDetectBackground: '#33F70C',

  /** URL for the add-on's page on support.mozilla.org */
  supportUrl: 'https://support.mozilla.org',
};

export default {
  async get(configName) {
    const defaultValue = DEFAULTS[configName];
    switch (typeof defaultValue) {
      case 'string':
        return browser.shoppingPrefs.getCharPref(configName, defaultValue);
      case 'number':
        return browser.shoppingPrefs.getIntPref(configName, defaultValue);
      case 'boolean':
        return browser.shoppingPrefs.getBoolPref(configName, defaultValue);
      default:
        throw new Error(`Invalid config type ${typeof defaultValue} for config ${configName}`);
    }
  },
};
