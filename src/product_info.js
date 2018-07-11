/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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

function portSuccess(port) {
  // Make sure page has finished loading, as JS could alter the DOM.
  if (document.readyState === 'complete') {
    getProductData(port);
  } else {
    window.addEventListener('load', () => {
      getProductData(port);
    });
  }
}

let delay = 2; // seconds
const DELAY_MULTIPLIER = 2;
const NUM_ATTEMPTS = 5;
const DELAY_MAX = delay ** NUM_ATTEMPTS;
// Connect to the background script until it's available. See Issue #17 and bug 1474727.
function portFail() {
  if (delay > DELAY_MAX) {
    console.error(`Could not establish a connection after ${NUM_ATTEMPTS} attempts.`);
    return;
  }
  setTimeout(() => {
    openBackgroundPort().then(portSuccess, portFail);
    delay *= DELAY_MULTIPLIER;
  }, delay * 1000); // ms
}

openBackgroundPort().then(portSuccess, portFail);
