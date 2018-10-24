/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Redux duck for vendors that sell products.
 * @module
 */

import pt from 'prop-types';

// Types

export const vendorShape = pt.shape({
  name: pt.string.isRequired,
  hostnames: pt.arrayOf(pt.string).isRequired,
  faviconUrl: pt.string,
});

// Eventually we will dynamically extract vendor data, but for now it's
// hard-coded.
const VENDORS = [
  {
    name: 'Amazon',
    hostnames: ['amazon.com', 'www.amazon.com', 'smile.amazon.com'],
    faviconUrl: 'https://www.amazon.com/favicon.ico',
  },
  {
    name: 'Best Buy',
    hostnames: ['bestbuy.com', 'www.bestbuy.com'],
    faviconUrl: 'https://www.bestbuy.com/favicon.ico',
  },
  {
    name: 'eBay',
    hostnames: ['ebay.com', 'www.ebay.com'],
    faviconUrl: 'https://www.ebay.com/favicon.ico',
  },
  {
    name: 'The Home Depot',
    hostnames: ['homedepot.com', 'www.homedepot.com'],
    faviconUrl: 'https://www.homedepot.com/favicon.ico',
  },
  {
    name: 'Walmart',
    hostnames: ['walmart.com', 'www.walmart.com'],
    faviconUrl: 'https://www.walmart.com/favicon.ico',
  },
  {
    name: 'mkelly Test',
    hostnames: ['mkelly.me', 'www.mkelly.me'],
    faviconUrl: '',
  },
];

// Selectors

export function getVendor(state, url) {
  const hostname = new URL(url).hostname;
  return VENDORS.find(vendor => vendor.hostnames.includes(hostname));
}
