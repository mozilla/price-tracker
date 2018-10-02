/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Note that this page is defined in the background script to run at
 * "document_idle", which is after all DOM content has been loaded.
 */

import config from 'commerce/config/content';
import extractProductWithFathom from 'commerce/extraction/fathom_extraction';
import extractProductWithFallback from 'commerce/extraction/fallback_extraction';

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

(async function main() {
  // If we're in an iframe, don't bother extracting a product EXCEPT if we were
  // started by the background script for a price check.
  const isInIframe = window !== window.top;
  const isBackgroundUpdate = window.location.hash === '#moz-commerce-background';
  if (isInIframe && !isBackgroundUpdate) {
    return;
  }

  // Only perform extraction on allowlisted sites. Background updates get a
  // pass; we don't want to accidentally freeze updates for products that are
  // being tracked no matter what.
  const url = new URL(document.location.href);
  const allowList = await config.get('extractionAllowlist');
  const allowAll = allowList.length === 1 && allowList[0] === '*';
  if (!allowAll && !isBackgroundUpdate && !allowList.includes(url.host)) {
    return;
  }

  // Make sure the page has finished loading, as JS could alter the DOM.
  if (document.readyState === 'complete') {
    getProductInfo();
  } else {
    window.addEventListener('load', getProductInfo);
  }
}());
