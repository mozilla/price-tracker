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
  const url = window.location.href;
  for (const [regExpStr, featureInfo] of Object.entries(extractionData)) {
    const regExp = new RegExp(regExpStr);
    if (regExp.test(url)) {
      return featureInfo;
    }
  }
  return null;
}

/**
 * Returns any product information available on the page from CSS
 * selectors if they exist, otherwise from Open Graph <meta> tags.
 */
export default function extractProduct() {
  const extractedProduct = {};
  const featureInfo = getFeatureInfo();
  if (featureInfo) {
    for (const [feature, routines] of Object.entries(featureInfo)) {
      for (const routine of routines) {
        const [selector, extractionMethod] = routine;
        const element = document.querySelector(selector);
        if (element) {
          extractedProduct[feature] = extractionMethod(element);
          if (extractedProduct[feature]) {
            break;
          } else {
            throw new Error(`Element found did not return a valid product ${feature}.`);
          }
        } else if (routine === routines[routines.length - 1]) {
          // None of the selectors matched an element on the page
          throw new Error(`No elements found with vendor data for product ${feature}.`);
        }
      }
    }
  } else {
    for (const [key, value] of Object.entries(OPEN_GRAPH_PROPERTY_VALUES)) {
      const metaEle = document.querySelector(`meta[property='${value}']`);
      if (metaEle) {
        extractedProduct[key] = metaEle.getAttribute('content');
      }
    }
  }
  return extractedProduct;
}
