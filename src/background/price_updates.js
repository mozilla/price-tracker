/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Functions to support background price checks.
 * @module
 */

import config from 'commerce/config';
import store from 'commerce/state';
import {shouldUpdatePrices} from 'commerce/privacy';
import {addPriceFromExtracted, getLatestPriceForProduct} from 'commerce/state/prices';
import {getAllProducts, getProduct, getProductIdFromExtracted} from 'commerce/state/products';
import {wait} from 'commerce/utils';

/**
 * Remove the x-frame-options header, so that the product page can load in the
 * background page's iframe.
 */
export function handleWebRequest(details) {
  // only remove the header if this extension's background page made the request
  if (details.documentUrl === window.location.href) {
    const responseHeaders = details.responseHeaders.filter(
      header => !header.name.toLowerCase().includes('x-frame-options'),
    );
    return {responseHeaders};
  }
  return {responseHeaders: details.responseHeaders};
}

/**
 * Find products that are due for price updates and update them.
 */
export async function updatePrices() {
  if (!(await shouldUpdatePrices())) {
    return;
  }

  const state = store.getState();
  const products = getAllProducts(state);
  const now = new Date();
  const priceCheckInterval = await config.get('priceCheckInterval');
  const delay = await config.get('iframeTimeout');
  for (const product of products) {
    const priceEntry = getLatestPriceForProduct(state, product.id);
    if (now - priceEntry.date > priceCheckInterval) {
      await fetchLatestPrice(product, delay); // eslint-disable-line no-await-in-loop
    }
  }
}

/**
 * Fetch the latest price info by loading the product page in an iframe; the
 * extraction content script will send us the latest price info, which is passed
 * to updateProductWithExtracted.
 * @param {Product} product
 */
async function fetchLatestPrice(product, delay) {
  // Do nothing if there's already a fetch in progress.
  if (document.getElementById(product.id)) {
    return;
  }

  const iframe = document.createElement('iframe');
  const url = new URL(product.url);
  url.hash = 'moz-commerce-background';
  iframe.src = url.href;
  iframe.id = product.id;
  // Desktop viewport dimensions (in px) on which Fathom proximity rules are based
  iframe.width = 1680;
  iframe.height = 950;
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
  document.body.appendChild(iframe);

  // Don't load another iframe until the previous one has been removed.
  await wait(delay);
  // Cleanup product's iframe whether it is finished or not.
  document.getElementById(product.id).remove();
}

/**
 * If we have a saved product matching the extracted data, update the
 * price history with the latest price.
 * @param {ExtractedProduct} data
 */
export function updateProductWithExtracted(data) {
  const state = store.getState();
  const id = getProductIdFromExtracted(data);
  const product = getProduct(state, id);
  if (product) {
    store.dispatch(addPriceFromExtracted(data));
  }
}
