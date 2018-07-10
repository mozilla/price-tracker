/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const OpenGraphPropertyValues = {
  title: 'og:title',
  image: 'og:image',
  price: 'og:price:amount',
};

let port;
// Recursively connect to the background script until it's available.
// See Issue #17 and bug 1474727.
function connectToBackground() {
  port = browser.runtime.connect();
  function getProductData() {
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

  port.onMessage.addListener((message) => {
    if (message.type === 'background-ready') {
      // Make sure page has finished loading, as JS could alter the DOM.
      if (document.readyState === 'complete') {
        getProductData();
      } else {
        window.addEventListener('load', () => {
          getProductData();
        });
      }
    }
  });
  port.onDisconnect.addListener((p) => {
    if (p.error) {
      window.setTimeout(() => {
        connectToBackground();
      }, 500);
    }
  });
}

connectToBackground();
