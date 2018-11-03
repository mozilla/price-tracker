/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Content script injected into tabs to attempt extracting information about a
 * product from the webpage. Set to run at "document_end" after the page has
 * been parsed but before all resources have been loaded.
 */

import uuidv4 from 'uuid/v4';

import config from 'commerce/config/content';
import extractProductWithFathom from 'commerce/extraction/fathom';
import extractProductWithCSSSelectors from 'commerce/extraction/selector';
import extractProductWithOpenGraph from 'commerce/extraction/open_graph';
import {shouldExtract} from 'commerce/privacy';
import recordEvent from 'commerce/telemetry/content';

/**
 * Extraction methods are given the document object for the page, and must
 * return either a valid ExtractedProduct, or null if a valid product could not
 * be found.
 */
const EXTRACTION_METHODS = {
  fathom: extractProductWithFathom,
  css_selectors: extractProductWithCSSSelectors,
  open_graph: extractProductWithOpenGraph,
};

let isBackgroundUpdate = false;
try {
  isBackgroundUpdate = window.top.location.href.startsWith(
    browser.runtime.getURL('/'), // URL is unique per-install / hard to forge
  );
} catch (err) {
  // Non-background updates may throw a cross-origin error
}

/**
 * Helper class to record extraction-related telemetry events.
 */
class ExtractionAttempt {
  constructor() {
    this.baseExtra = {
      extraction_id: uuidv4(),
      is_bg_update: isBackgroundUpdate,
    };
  }

  start() {
    recordEvent('attempt_extraction', 'product_page', null, {
      ...this.baseExtra,
    });
  }

  succeed(methodName) {
    recordEvent('complete_extraction', 'product_page', null, {
      ...this.baseExtra,
      method: methodName,
    });
  }

  fail() {
    recordEvent('complete_extraction', 'product_page', null, {
      ...this.baseExtra,
      method: 'none',
    });
  }
}

/**
 * Perform product extraction, trying each method from EXTRACTION_METHODS in
 * order until one of them returns a truthy result.
 * @return {ExtractedProduct|null}
 */
function extractProduct() {
  const attempt = new ExtractionAttempt();
  attempt.start();
  for (const [methodName, extract] of Object.entries(EXTRACTION_METHODS)) {
    const extractedProduct = extract(window.document);
    if (extractedProduct) {
      attempt.succeed(methodName);
      return extractedProduct;
    }
  }
  attempt.fail();
  return null;
}

async function sendProductToBackground(extractedProduct) {
  if (!extractedProduct) {
    return null;
  }

  return browser.runtime.sendMessage({
    type: 'extracted-product',
    extractedProduct: {
      ...extractedProduct,
      url: document.location.href,
      date: (new Date()).toISOString(),
    },
  });
}

/**
 * Checks to see if any product information for the page was found,
 * and if so, sends it to the background script.
 */
async function attemptExtraction() {
  const extractedProduct = extractProduct();
  if (extractedProduct) {
    await sendProductToBackground(extractedProduct);
  }

  return extractedProduct;
}

(async function main() {
  // If we're in an iframe, don't bother extracting a product EXCEPT if we were
  // started by the background script for a price check.
  const isInIframe = window !== window.top;

  if (isInIframe && !isBackgroundUpdate) {
    return;
  }

  // Check privacy settings to determine if we should extract.
  if (!(await shouldExtract())) {
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

  // Record visit_supported_site event
  if (!isBackgroundUpdate) {
    await recordEvent('visit_supported_site', 'supported_site');
  }

  // Extract immediately, and again if the readyState changes.
  let extractedProduct = await attemptExtraction();
  document.addEventListener('readystatechange', async () => {
    extractedProduct = await attemptExtraction();
  });

  browser.runtime.onMessage.addListener(async (message) => {
    if (message.type === 'reextract-product') {
      // Re-extract the product if requested
      extractedProduct = await attemptExtraction();
      await sendProductToBackground(extractedProduct);
    } else if (message.type === 'resend-product') {
      // Re-send the already-extracted product if requested
      await sendProductToBackground(extractedProduct);
    }
  });
}());
