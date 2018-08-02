/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Uses Fathom to extract a product from its product page,
 * where a 'product' is defined by the bundle of features that
 * makes it identifiable.
 *
 * Features: title, image, price
 */

import {dom, out, rule, ruleset, score, type} from 'fathom-web';
import fathomCoeffs from 'commerce/fathom_coefficients.json';

const SCORE_THRESHOLD = fathomCoeffs.hasDivWithPriceClass;

/**
 * Checks to see if an element is a <div> with a class of "price".
 * Returns an integer corresponding to the coefficient to use for
 * scoring an element with this rule.
 */
function hasDivWithPriceClass(fnode) {
  if (fnode.element.classList.contains('price')) {
    return fathomCoeffs.hasDivWithPriceClass;
  }
  return 1;
}

/**
 * Ruleset for product features. Each feature has its own type.
 */
const rules = ruleset(
  // get all elements that could contain the price
  rule(dom('div'), type('priceish')),

  // check class names to see if they contain 'price'
  rule(type('priceish'), score(hasDivWithPriceClass)),

  // return price element with max score
  rule(type('priceish').max(), out('product-price')),
);

/**
 * Extracts the highest scoring element above a score threshold
 * contained in a page's HTML document.
 */
function runRuleset(doc) {
  let fnodesList = rules.against(doc).get('product-price');
  fnodesList = fnodesList.filter(fnode => fnode.scoreFor('priceish') >= SCORE_THRESHOLD);
  // It is possible for multiple elements to have the same highest score.
  if (fnodesList.length >= 1) {
    return fnodesList[0].element;
  }
  return null;
}

/*
 * Run the ruleset for the product features against the current window document
 */
export default function extractProduct(doc) {
  const priceEle = runRuleset(doc);
  if (priceEle) {
    const price = (priceEle.tagName !== 'META') ? priceEle.textContent : priceEle.getAttribute('content');
    if (price) {
      return {
        price,
      };
    }
  }
  return null;
}
