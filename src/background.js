/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const PRODUCT_KEYS = ['title', 'image', 'price'];

browser.browserAction.onClicked.addListener(() => {
  browser.sidebarAction.open();
});

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'product-data') {
    const isProductPage = hasKeys(message.data, PRODUCT_KEYS);
    if (isProductPage) {
      browser.sidebarAction.setPanel({
        panel: getPanelURL(message.data),
        tabId: sender.tab.id,
      });
    }
  }
});

/**
 * Check if an object contains all the specified keys.
 */
function hasKeys(object, keys) {
  return keys.map(key => key in object).every(val => val);
}

/**
 * Generate the sidebar panel URL for a specific product.
 */
function getPanelURL(productData) {
  const url = new URL(browser.extension.getURL('/sidebar.html'));
  for (const key of PRODUCT_KEYS) {
    url.searchParams.set(key, productData[key]);
  }
  return url.href;
}
