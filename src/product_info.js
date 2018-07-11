/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const OPEN_GRAPH_PROPERTY_VALUES = {
  title: 'og:title',
  image: 'og:image',
  price: 'og:price:amount',
};
const PRODUCT_RECOGNITION_DATA_URL = 'product_recognition_data.json';
// prd = product recognition data
let prd;

function init() {
  const prdUrl = browser.extension.getURL(PRODUCT_RECOGNITION_DATA_URL);
  getPrd(prdUrl).then((data) => {
    prd = data;
    const selectors = getSelectors();
    const productInfo = getProductInfo(selectors);
    if (productInfo) {
      // Note: Can't send HTML elements to background.js; they are not stringify-able
      browser.runtime.sendMessage({
        type: 'product-data',
        data: productInfo,
      });
    } else {
      console.log('No product elements were found for this vendor.');
    }
  });
}

async function getPrd(url) {
  // 'import' and 'require' not yet supported in WebExtensions
  let data = await fetch(url);
  data = await data.json();
  return data;
}

function getSelectors() {
  const hostname = new URL(window.location.href).host;
  // See if top level key of data blob is a substring in hostname
  for (const [vendor, selectors] of Object.entries(prd)) {
    if (hostname.includes(vendor)) {
      const titleSelector = selectors.title || null;
      const priceSelector = selectors.price || null;
      const imageSelector = selectors.image || null;
      if (titleSelector || priceSelector || imageSelector) {
        // We have at least one CSS selector for this vendor
        return {
          title: titleSelector,
          price: priceSelector,
          image: imageSelector,
        };
      }
    }
  }
  return null;
}

function getProductInfo(selectors) {
  const data = {};
  if (!selectors) {
    // Didn't find an element based on the CSS selectors for this product,
    // check OpenGraph <meta> tags.
    for (const [key, value] of Object.entries(OPEN_GRAPH_PROPERTY_VALUES)) {
      const metaEle = document.querySelector(`meta[property='${value}']`);
      if (metaEle) {
        data[key] = metaEle.getAttribute('content');
      }
    }
    return data;
  }

  for (const selector in selectors) {
    // avoid iterating over properties inherited through the prototype chain
    if (Object.prototype.hasOwnProperty.call(selectors, selector)) {
      const valueArr = selectors[selector];
      let element = null;
      for (let i = 0; i < valueArr.length; i++) {
        const value = valueArr[i];
        element = document.querySelector(value);
        if (element) {
          data[selector] = element.innerText || element.src;
          break;
        }
      }
    }
  }
  return data;
}

// Make sure page has finished loading, as JS could alter the DOM.
if (document.readyState === 'complete') {
  init();
} else {
  window.addEventListener('load', () => {
    init();
  });
}
