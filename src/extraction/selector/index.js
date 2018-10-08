/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
* Uses CSS selectors, or failing that, Open Graph <meta> tags to extract
* a product from its product page, where a 'product' is defined by the bundle
* of features that makes it identifiable.
*
* Features: title, image, price
*/

import extractionData from 'commerce/extraction/selector/selectors';

/**
 * Returns any extraction data found for the vendor based on the URL
 * for the page.
 */
function getFeatureInfo() {
  const hostname = new URL(window.location.href).host;
  for (const siteInfo of extractionData) {
    for (const domain of siteInfo.domains) {
      if (hostname.includes(domain)) {
        return siteInfo.features;
      }
    }
  }
  return null;
}

function findValue(extractors) {
  for (const [selector, extractionMethod] of extractors) {
    const element = document.querySelector(selector);
    if (element) {
      const value = extractionMethod(element);
      if (value) {
        return value;
      }
      // eslint-disable-next-line no-console
      console.warn('Element found did not return a valid value for the product feature.');
    }
  }
  // eslint-disable-next-line no-console
  console.warn('No elements found with vendor data for the product feature.');
  return null;
}

/**
 * Returns any product information available on the page from CSS
 * selectors if they exist.
 */
export default function extractProduct() {
  const featureInfo = getFeatureInfo();
  if (featureInfo) {
    const extractedProduct = {};
    for (const [feature, extractors] of Object.entries(featureInfo)) {
      const featureValue = findValue(extractors);
      if (!featureValue) {
        return null;
      }

      extractedProduct[feature] = featureValue;
    }

    return extractedProduct;
  }

  return null;
}
