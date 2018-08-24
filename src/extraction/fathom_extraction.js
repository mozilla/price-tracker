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
import {SCORE_THRESHOLD} from 'commerce/config';

const PRODUCT_FEATURES = ['title', 'price', 'image'];
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
      extractedElements[feature] = fnodesList[0].element;
    }
  }
  return extractedElements;
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
      } else {
        extractedProduct[feature] = extractedElements[feature].innerText;
      }
    }
  }
  return hasAllFeatures(extractedProduct) ? extractedProduct : null;
}
