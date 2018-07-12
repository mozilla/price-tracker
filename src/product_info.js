import utils from './utils';

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(async function main() {
  const OpenGraphPropertyValues = {
    title: 'og:title',
    image: 'og:image',
    price: 'og:price:amount',
  };

  function openBackgroundPort() {
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

  function getProductData(port) {
    const data = {};
    for (const [key, value] of Object.entries(OpenGraphPropertyValues)) {
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

  try {
    const port = await utils.retry(openBackgroundPort);
    // Make sure page has finished loading, as JS could alter the DOM.
    if (document.readyState === 'complete') {
      getProductData(port);
    } else {
      window.addEventListener('load', () => {
        getProductData(port);
      });
    }
  } catch (err) {
    console.error('Could not establish connection to background script.');
  }
}());
