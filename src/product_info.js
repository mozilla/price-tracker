/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {retry} from 'commerce/utils';
import extractionData from './product_extraction_data.json';

const OPEN_GRAPH_PROPERTY_VALUES = {
  title: 'og:title',
  image: 'og:image',
  price: 'og:price:amount',
};

/**
 * Open a Port to the background script and wait for the background script to
 * be ready. Rejects if we cannot connect or if the background script is not
 * ready (see also bug 1474727).
 */
async function openBackgroundPort() {
  return new Promise((resolve, reject) => {
    const port = browser.runtime.connect();
    port.onMessage.addListener((message) => {
      if (message.type === 'background-ready') {
        resolve(port);
      }
    });
    port.onDisconnect.addListener(() => {
      reject();
    });
  });
}

(async function main() {
  let port = null;
  try {
    port = await retry(openBackgroundPort);
  } catch (err) {
    throw new Error('Could not establish connection to background script.');
  }
  if (port) {
    // Make sure the page has finished loading, as JS could alter the DOM.
    if (document.readyState === 'complete') {
      getProductInfo(port);
    } else {
      window.addEventListener('load', () => {
        getProductInfo(port);
      });
    }
  }
}());

/**
 * Checks to see if any product information for the page was found,
 * and if so, sends it to the background script via the port.
 */
async function getProductInfo(port) {
  const productInfo = extractData();
  if (productInfo) {
    port.postMessage({
      type: 'product-data',
      data: productInfo,
    });
  }
}

/**
 * Returns any extraction data found for the vendor based on the URL
 * for the page.
 */
function getProductAttributeInfo() {
  const hostname = new URL(window.location.href).host;
  for (const [vendor, attributeInfo] of Object.entries(extractionData)) {
    if (hostname.includes(vendor)) {
      return attributeInfo;
    }
  }
  return null;
}

/**
 * Extracts and returns the string value for a given element property or attribute.
 *
 * @param {HTMLElement} element
 * @param {string} extractionProperty
 */
function extractValueFromElement(element, extractionProperty) {
  switch (extractionProperty) {
    case 'content':
      return element.getAttribute('content');
    case 'innerText':
      return element.innerText;
    case 'src':
      return element.src;
    default:
      throw new Error(`Unrecognized extraction property or attribute '${extractionProperty}'.`);
  }
}

/**
 * Returns any product information available on the page from CSS
 * selectors if they exist, otherwise from Open Graph <meta> tags.
 */
function extractData() {
  const data = {};
  const attributeInfo = getProductAttributeInfo();
  if (attributeInfo) {
    for (const [productAttribute, extractor] of Object.entries(attributeInfo)) {
      const {selectors, extractUsing} = extractor;
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          data[productAttribute] = extractValueFromElement(element, extractUsing);
          if (data[productAttribute]) {
            break;
          } else {
            throw new Error(`Element found did not return a valid product ${productAttribute}.`);
          }
        } else if (selector === selectors[selectors.length - 1]) {
          // None of the selectors matched an element on the page
          throw new Error(`No elements found with vendor data for product ${productAttribute}.`);
        }
      }
    }
  } else {
    for (const [key, value] of Object.entries(OPEN_GRAPH_PROPERTY_VALUES)) {
      const metaEle = document.querySelector(`meta[property='${value}']`);
      if (metaEle) {
        data[key] = metaEle.getAttribute('content');
      }
    }
  }
  return data;
}
