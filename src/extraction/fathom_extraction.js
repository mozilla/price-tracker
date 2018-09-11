/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Uses Fathom to extract a product from its product page,
 * where a 'product' is defined by the bundle of features that
 * makes it identifiable.
 *
 * Features: title, image, price
 */

import defaultCoefficients from 'commerce/extraction/fathom_default_coefficients.json';
import RulesetFactory from 'commerce/extraction/ruleset_factory';

const PRODUCT_FEATURES = ['title', 'price', 'image'];
// Minimum score to be considered the "correct" feature element extracted by Fathom
const SCORE_THRESHOLD = 4;
// Array of numbers corresponding to the coefficients in order
const coefficients = RulesetFactory.getCoeffsInOrder(defaultCoefficients);
// For production, we don't need to generate a new ruleset factory
// and ruleset every time we run Fathom, since the coefficients are static.
const rulesetFactory = new RulesetFactory(coefficients);
const rules = rulesetFactory.makeRuleset();

/**
 * Extracts the highest scoring element above a score threshold
 * contained in a page's HTML document.
 */
function runRuleset(doc) {
  const extractedElements = {};
  const results = rules.against(doc);
  for (const feature of PRODUCT_FEATURES) {
    let fnodesList = results.get(feature);
    fnodesList = fnodesList.filter(fnode => fnode.scoreFor(`${feature}ish`) >= SCORE_THRESHOLD);
    // It is possible for multiple elements to have the same highest score.
    if (fnodesList.length >= 1) {
      const element = fnodesList[0].element;
      // Check for price units and subunits
      if (feature === 'price' && element.children.length > 0) {
        extractedElements[feature] = getPriceUnitElements(element);
        continue;
      }
      extractedElements[feature] = element;
    }
  }
  return extractedElements;
}

/**
 * Returns true if the string contains a number.
 */
function hasNumber(string) {
  return /\d/.test(string);
}

/**
 * Get the main and sub unit elements for the product price.
 *
 * @returns {Object} A string:element object with 'mainUnit' and 'subUnit' keys.
 */
function getPriceUnitElements(element) {
  let isMainUnit = true;
  const priceElements = {};
  // Loop through children: first element containing a digit is main unit,
  // second is subunit.
  for (const priceSubEle of element.children) {
    if (hasNumber(priceSubEle.innerText)) {
      if (isMainUnit) {
        priceElements.mainUnit = priceSubEle;
        isMainUnit = false;
      } else {
        priceElements.subUnit = priceSubEle;
      }
    }
  }
  return priceElements;
}

/**
 * Checks if a price object has subunits and returns a price string.
 *
 * @param {Object} If the price has subunits, an object literal, else an HTML element
 */
function getPriceString(priceObj) {
  // Check for subunits e.g. dollars and cents.
  if ('mainUnit' in priceObj) {
    const mainUnitStr = priceObj.mainUnit.innerText;
    const subUnitStr = priceObj.subUnit.innerText;
    return cleanPriceString(`$${mainUnitStr}.${subUnitStr}`);
  }
  return cleanPriceString(priceObj.innerText);
}


/**
 * Reformats price string to be of form "$NX.XX".
 */
function cleanPriceString(priceStr) {
  // Remove any commas
  let cleanedPriceStr = priceStr.replace(/,/g, '');
  // Remove any characters preceding the '$' and following the '.XX'
  cleanedPriceStr = cleanedPriceStr.substring(cleanedPriceStr.indexOf('$'));
  cleanedPriceStr = cleanedPriceStr.substring(0, cleanedPriceStr.indexOf('.') + 3);
  return cleanedPriceStr;
}

/**
 * Returns true if every key in PRODUCT_FEATURES has a truthy value.
 */
function hasAllFeatures(obj) {
  return PRODUCT_FEATURES.map(key => obj[key]).every(val => val);
}

/*
 * Run the ruleset for the product features against the current window document
 */
export default function extractProduct(doc) {
  const extractedProduct = {};
  const extractedElements = runRuleset(doc);
  if (hasAllFeatures(extractedElements)) {
    for (const feature of PRODUCT_FEATURES) {
      if (feature === 'image') {
        extractedProduct[feature] = extractedElements[feature].src;
        continue;
      // Clean up price string and check for subunits
      } else if (feature === 'price') {
        const priceStr = getPriceString(extractedElements[feature]);
        extractedProduct[feature] = priceStr;
        continue;
      }
      extractedProduct[feature] = extractedElements[feature].innerText;
    }
  }
  return hasAllFeatures(extractedProduct) ? extractedProduct : null;
}
