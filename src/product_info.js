/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Note that this page is defined in the background script to run at
 * "document_idle", which is after all DOM content has been loaded.
 */

import extractProductWithFathom from 'commerce/fathom_extraction';
import extractProductWithFallback from 'commerce/fallback_extraction';

/**
 * Checks to see if any product information for the page was found,
 * and if so, sends it to the background script.
 */
async function getProductInfo() {
  const extractedProduct = (
    extractProductWithFathom(window.document)
    || extractProductWithFallback()
  );
  await browser.runtime.sendMessage({
    from: 'content',
    subject: 'ready',
    extractedProduct: {
      ...extractedProduct,
      url: document.location.href,
      date: (new Date()).toISOString(),
    },
  });
}

(function main() {
  // If we're in an iframe, don't bother extracting a product EXCEPT if we were
  // started by the background script for a price check.
  const isInIframe = window !== window.top;
  const isBackgroundUpdate = window.location.hash === '#moz-commerce-background';
  if (!isInIframe || isBackgroundUpdate) {
    // Make sure the page has finished loading, as JS could alter the DOM.
    if (document.readyState === 'complete') {
      getProductInfo();
    } else {
      window.addEventListener('load', getProductInfo);
    }
  }
}());
