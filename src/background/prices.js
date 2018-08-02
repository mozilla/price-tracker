/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {IFRAME_TIMEOUT, PRICE_CHECK_INTERVAL} from 'commerce/config';
import store from 'commerce/state';
import {addPriceFromExtracted, getLatestPriceForProduct} from 'commerce/state/prices';
import {getAllProducts, getProduct, getProductIdFromExtracted} from 'commerce/state/products';


/**
 * Find products that are due for price updates and update them.
 */
export function updatePrices() {
  const state = store.getState();
  const products = getAllProducts(state);
  const now = new Date();

  for (const product of products) {
    const priceEntry = getLatestPriceForProduct(state, product.id);
    if (now - priceEntry.date > PRICE_CHECK_INTERVAL) {
      fetchLatestPrice(product);
    }
  }
}

/**
 * Fetch the latest price info by loading the product page in an iframe; the
 * extraction content script will send us the latest price info, which is passed
 * to updateProductWithExtracted.
 */
function fetchLatestPrice(product) {
  // Do nothing if there's already a fetch in progress.
  if (document.getElementById(product.id)) {
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.src = product.url;
  iframe.id = product.id;
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
  document.body.appendChild(iframe);

  // Cleanup iframe whether it is finished or not.
  setTimeout(() => {
    document.getElementById(product.id).remove();
  }, IFRAME_TIMEOUT);
}

/**
 * If we have a saved product matching the extracted data, update the
 * price history with the latest price.
 */
export function updateProductWithExtracted(data) {
  const state = store.getState();
  const id = getProductIdFromExtracted(data);
  const product = getProduct(state, id);
  if (product) {
    store.dispatch(addPriceFromExtracted(data));
  }
}
