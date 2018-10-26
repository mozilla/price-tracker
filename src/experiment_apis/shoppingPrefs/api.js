/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global ChromeUtils, ExtensionAPI */

this.shoppingPrefs = class extends ExtensionAPI {
  getAPI() {
    const {Services} = ChromeUtils.import('resource://gre/modules/Services.jsm', {});
    const branch = Services.prefs.getBranch('extensions.shopping-testpilot@mozilla.org.');
    return {
      shoppingPrefs: {
        async getBoolPref(prefName, defaultValue) {
          return branch.getBoolPref(prefName, defaultValue);
        },
        async getCharPref(prefName, defaultValue) {
          return branch.getCharPref(prefName, defaultValue);
        },
        async getIntPref(prefName, defaultValue) {
          return branch.getIntPref(prefName, defaultValue);
        },
      },
    };
  }
};
