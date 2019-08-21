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

import RulesetFactory from 'commerce/extraction/fathom/ruleset_factory';
import {parsePrice} from 'commerce/extraction/utils';
import {biases} from 'commerce/extraction/fathom/biases.json';
import coefficients from 'commerce/extraction/fathom/coefficients.json';

// Minimum score to be considered the "correct" feature element extracted by Fathom
const SCORE_THRESHOLD = 0.5;
// For production, we don't need to generate a new ruleset factory
// and ruleset every time we run Fathom, since the coefficients are static.
const rulesetFactory = new RulesetFactory();
const rules = rulesetFactory.makeRuleset([
  ...coefficients.image,
  ...coefficients.title,
  ...coefficients.price,
],
biases);

/** How product information is extracted depends on the feature */
const FEATURE_DEFAULTS = {
  getValueFromElement(element) {
    return element.innerText;
  },
};
const PRODUCT_FEATURES = {
  image: {
    ...FEATURE_DEFAULTS,
    /**
     * @return the URL of an image resource
     */
    getValueFromElement(element) {
      /**
       * Given a CSS url() declaration 'url("http://foo")', return 'http://foo'.
       */
      function urlFromCssDeclaration(declaration) {
        return declaration.slice(5, -2);
      }

      if (element.tagName === 'IMG') {
        return element.src;
      }
      // The other thing the ruleset can return is an arbitrary element with
      // a CSS background image.
      return urlFromCssDeclaration(getComputedStyle(element)['background-image']);
    },
  },
  title: {
    ...FEATURE_DEFAULTS,
  },
  price: {
    ...FEATURE_DEFAULTS,
    getValueFromElement(element) {
      const tokens = Array.from(element.childNodes).map(node => node.textContent);
      return parsePrice(tokens);
    },
  },
};

/**
 * Extracts the highest scoring element above a score threshold
 * contained in a page's HTML document.
 */
function runRuleset(doc) {
  const extractedElements = {};
  const results = rules.against(doc);
  for (const feature of Object.keys(PRODUCT_FEATURES)) {
    let fnodesList = results.get(feature);
    fnodesList = fnodesList.filter(fnode => fnode.scoreFor(`${feature}`) >= SCORE_THRESHOLD);
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
  return Object.keys(PRODUCT_FEATURES).map(key => obj[key]).every(val => val);
}

/*
 * Run the ruleset for the product features against the current window document
 */
export default function extractProduct(doc) {
  const extractedProduct = {};
  const extractedElements = runRuleset(doc);
  if (hasAllFeatures(extractedElements)) {
    for (const [feature, methods] of Object.entries(PRODUCT_FEATURES)) {
      extractedProduct[feature] = methods.getValueFromElement(extractedElements[feature]);
    }
  }
  return hasAllFeatures(extractedProduct) ? extractedProduct : null;
}
