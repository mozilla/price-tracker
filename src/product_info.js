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
  const cssSelectors = getCssSelectors();
  const productInfo = extractData(cssSelectors);
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
function getCssSelectors() {
  const hostname = new URL(window.location.href).host;
  for (const [vendor, selectors] of Object.entries(extractionData)) {
    if (hostname.includes(vendor)) {
      const {title, price, image} = selectors || null;
      return {
        title,
        price,
        image,
      };
    }
  }
  return null;
}

/**
 * Returns any product information available on the page from CSS
 * selectors if they exist, otherwise from Open Graph <meta> tags.
 */
function extractData(selectors) {
  const data = {};
  if (selectors) {
    for (const selector in selectors) {
      // Avoid iterating over properties inherited through the prototype chain
      if (Object.prototype.hasOwnProperty.call(selectors, selector)) {
        const valueArr = selectors[selector];
        let element = null;
        for (let i = 0; i < valueArr.length; i++) {
          const value = valueArr[i];
          element = document.querySelector(value);
          if (element) {
            data[selector] = element.getAttribute('content')
              || element.innerText
              || element.src;
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
