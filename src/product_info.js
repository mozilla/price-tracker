/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Note that this page is defined in manifest.json to run at "document_idle"
 * which is after all DOM content has been loaded.
 */

import extractProductWithFathom from 'commerce/fathom_extraction';
import extractProductWithFallback from 'commerce/fallback_extraction';
import {retry} from 'commerce/utils';

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
  const extractedProduct = (extractProductWithFathom(window.document)
    || extractProductWithFallback());
  extractedProduct.url = window.document.URL;
  port.postMessage({
    from: 'content',
    subject: 'ready',
    extractedProduct,
  });
}
