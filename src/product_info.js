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
    console.error('Could not establish connection to background script.');
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
 *
 * @param {string} property The property name to read from
 */
function getProductAttributeInfo(property) {
  const hostname = new URL(window.location.href).host;
  for (const [vendor, attributeInfo] of Object.entries(extractionData)) {
    if (hostname.includes(vendor)) {
      return {
        title: attributeInfo.title[property],
        price: attributeInfo.price[property],
        image: attributeInfo.image[property],
      };
    }
  }
  return null;
}

/**
 * Returns any product information available on the page from CSS
 * selectors if they exist, otherwise from Open Graph <meta> tags.
 */
function extractData() {
  const data = {};
  const selectors = getProductAttributeInfo('selectors');
  if (selectors) {
    for (const [productAttribute, selectorArr] of Object.entries(selectors)) {
      for (const selector of selectorArr) {
        const element = document.querySelector(selector);
        if (element) {
          const extractUsing = getProductAttributeInfo('extractUsing');
          const extractionValue = extractUsing[productAttribute];
          switch (extractionValue) {
            case 'content':
              data[productAttribute] = element.getAttribute('content');
              break;
            case 'innerText':
              data[productAttribute] = element.innerText;
              break;
            case 'src':
              data[productAttribute] = element.src;
              break;
            default:
              console.error(`Unrecognized extraction value '${extractionValue}'.`);
              break;
          }
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
