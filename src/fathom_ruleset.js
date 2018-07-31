/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
 * Using fathom to extract a product from its product page,
 * where a 'product' is defined by the bundle of features that
 * makes it identifiable.
 *
 * Features: Title, Image, Price
 *
 * Note that this page is defined in manifest.json to run at "document_idle"
 * which is after all DOM content has been loaded.
 *
 */

import {dom, out, rule, ruleset, score, type} from 'fathom-web';

const tuningRoutines = {
  price: {routine: tunedPriceFnodes, coeffs: [2]},
};

/*
 * Remove dollar sign, strip whitespace, strip words (anything not numeric
 * or a price symbol), and remove trailing zeros
 */
function formatPrice(priceString) {
  const formattedPriceStr = priceString.replace('$', '').replace(/([\s]|[^0-9$.-])/g, '');
  return parseFloat(formattedPriceStr.substr(formattedPriceStr.indexOf('$') + 1));
}

/*
 * Ruleset for product prices
 */
function tunedPriceFnodes(coeffHasDivWithPriceClass = 1) {
  function hasDivWithPriceClass(fnode) {
    if (fnode.element.classList.contains('price')) {
      return coeffHasDivWithPriceClass;
    }
    return 1;
  }

  const rules = ruleset(
    // get all elements that could contain the price
    rule(dom('div'), type('priceish')),

    // check class names to see if they contain 'price'
    rule(type('priceish'), score(hasDivWithPriceClass)),

    // return price element with max score
    rule(type('priceish').max(), out('product-price')),
  );

  function tuningRoutine(doc) {
    return rules.against(doc).get('product-price');
  }

  return tuningRoutine;
}

export {tuningRoutines, formatPrice};
