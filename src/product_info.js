import utils from './utils';

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const OPEN_GRAPH_PROPERTY_VALUES = {
  title: 'og:title',
  image: 'og:image',
  price: 'og:price:amount',
};

/**
 * Resolves to a Port object for communicating with the background script
 * once the background script is ready, or rejects if we cannot connect
 * to the background script, or it is not ready. See bug 1474727.
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

/*
 * Extract any product information available on the page using Open Graph
 * <meta> tags, and sends it to the port as an argument.
 */
function getProductData(port) {
  const data = {};
  for (const [key, value] of Object.entries(OPEN_GRAPH_PROPERTY_VALUES)) {
    const metaEle = document.querySelector(`meta[property="${value}"]`);
    if (metaEle) {
      data[key] = metaEle.getAttribute('content');
    }
  }
  port.postMessage({
    type: 'product-data',
    data,
  });
}

(async function main() {
  let port = null;
  try {
    port = await utils.retry(openBackgroundPort);
  } catch (err) {
    console.error('Could not establish connection to background script.');
  }
  if (port) {
    // Make sure page has finished loading, as JS could alter the DOM.
    if (document.readyState === 'complete') {
      getProductData(port);
    } else {
      window.addEventListener('load', () => {
        getProductData(port);
      });
    }
  }
}());
