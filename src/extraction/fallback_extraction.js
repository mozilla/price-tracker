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

import extractionData from 'commerce/extraction/fallback_extraction_selectors.json';
import {getPriceString, extractValueFromElement} from 'commerce/utils';


const OPEN_GRAPH_PROPERTY_VALUES = {
  title: 'og:title',
  image: 'og:image',
  price: 'og:price:amount',
};

/**
 * Returns any extraction data found for the vendor based on the URL
 * for the page.
 */
function getProductAttributeInfo() {
  const url = window.location.href;
  for (const [regExpStr, attributeInfo] of Object.entries(extractionData)) {
    const regExp = new RegExp(regExpStr);
    if (regExp.test(url)) {
      return attributeInfo;
    }
  }
  return null;
}

/**
 * Returns any product information available on the page from CSS
 * selectors if they exist, otherwise from Open Graph <meta> tags.
 */
export default function extractProduct() {
  const data = {};
  const attributeInfo = getProductAttributeInfo();
  if (attributeInfo) {
    for (const [productAttribute, tuples] of Object.entries(attributeInfo)) {
      for (const tuple of tuples) {
        const [selector, extractUsing] = tuple;
        const element = document.querySelector(selector);
        if (element) {
          if (productAttribute === 'price') {
            data[productAttribute] = getPriceString(element, extractUsing);
          } else {
            data[productAttribute] = extractValueFromElement(element, extractUsing);
          }
          if (data[productAttribute]) {
            break;
          } else {
            throw new Error(`Element found did not return a valid product ${productAttribute}.`);
          }
        } else if (tuple === tuples[tuples.length - 1]) {
          // None of the selectors matched an element on the page
          throw new Error(`No elements found with vendor data for product ${productAttribute}.`);
        }
      }
    }
  } else {
    for (const [key, value] of Object.entries(OPEN_GRAPH_PROPERTY_VALUES)) {
      const metaEle = document.querySelector(`meta[property='${value}']`);
      if (metaEle) {
        data[key] = metaEle.getAttribute('content');
      }
    }
  }
  return data;
}
