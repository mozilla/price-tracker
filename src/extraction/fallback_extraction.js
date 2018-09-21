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

import extractionData from 'commerce/extraction/fallback_extraction_selectors';


const OPEN_GRAPH_PROPERTY_VALUES = {
  title: 'og:title',
  image: 'og:image',
  price: 'og:price:amount',
};

/**
 * Returns any extraction data found for the vendor based on the URL
 * for the page.
 */
function getFeatureInfo() {
  const hostname = new URL(window.location.href).host;
  for (const [vendorDomainsStr, featureInfo] of Object.entries(extractionData)) {
    const vendorDomains = vendorDomainsStr.split('_');
    for (const domain of vendorDomains) {
      if (hostname.includes(domain)) {
        return featureInfo;
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
      throw new Error('Element found did not return a valid value for the product feature.');
    }
  }
  // None of the selectors matched an element on the page
  throw new Error('No elements found with vendor data for the product feature.');
}

/**
 * Returns any product information available on the page from CSS
 * selectors if they exist, otherwise from Open Graph <meta> tags.
 */
export default function extractProduct() {
  const extractedProduct = {};
  const featureInfo = getFeatureInfo();
  if (featureInfo) {
    for (const [feature, extractors] of Object.entries(featureInfo)) {
      extractedProduct[feature] = findValue(extractors);
    }
  } else {
    for (const [feature, propertyValue] of Object.entries(OPEN_GRAPH_PROPERTY_VALUES)) {
      const metaEle = document.querySelector(`meta[property='${propertyValue}']`);
      if (metaEle) {
        extractedProduct[feature] = metaEle.getAttribute('content');
      }
    }
  }
  return extractedProduct;
}
