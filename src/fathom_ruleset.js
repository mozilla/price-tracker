/** This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Using Fathom to extract a product from its product page,
 * where a 'product' is defined by the bundle of features that
 * makes it identifiable.
 *
 * Features: title, image, price
 */

import {dom, out, rule, ruleset, score, type} from 'fathom-web';
import fathomCoeffs from 'commerce/fathom_coefficients.json';

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
 * Extracts the highest scoring element for a given feature contained
 * in a page's HTML document.
 */
export default function runTuningRoutine(doc) {
  const fnodesList = rules.against(doc).get('product-price');
  // It is possible for multiple elements to have the same highest score.
  const elementsList = fnodesList.map(fnode => fnode.element);
  if (elementsList.length === 1) {
    return elementsList[0];
  }
  return null;
}
