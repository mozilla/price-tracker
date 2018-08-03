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

const PRODUCT_FEATURES = ['title', 'price', 'image'];
const SCORE_THRESHOLD = 3;
const DEFAULT_SCORE = 1;
const VIEWPORT_HEIGHT = window.innerHeight;

/**
 * Each of these functions represents a rule check: if the fnode passes
 * the rule, it gets a weighted score from 'fathom_coefficients.json';
 * otherwise, it gets the default score.
 */

/**
 * Returns true if the fnode is above the fold
 */
function isAboveTheFold(fnode) {
  const domRect = fnode.element.getBoundingClientRect();
  if (domRect.top <= VIEWPORT_HEIGHT) {
    return true;
  }
  return false;
}

/**
 * Scores fnode in direct proportion to its size
 */
function largerImage(fnode) {
  const domRect = fnode.element.getBoundingClientRect();
  const area = (domRect.width) * (domRect.height);
  if (area === 0) {
    return DEFAULT_SCORE;
  }
  return area * fathomCoeffs.largerImage;
}

/**
 * Scores fnode with a '$' in its innerText
 */
function hasDollarSign(fnode) {
  if (fnode.element.innerText.includes('$')) {
    return fathomCoeffs.hasDollarSign;
  }
  return DEFAULT_SCORE;
}

/**
 * Scores fnode in direct proportion to its font size
 */
function largerFontSize(fnode) {
  const sizeWithUnits = window.getComputedStyle(fnode.element).getPropertyValue('font-size');
  const size = sizeWithUnits.replace('px', '');
  if (size) {
    return (parseInt(size, 10) * fathomCoeffs.largerFontSize);
  }
  return DEFAULT_SCORE;
}

/**
 * Ruleset for product features. Each feature has its own type.
 */
const rules = ruleset(
  /**
  * Image rules
  */
  // consider all img elements near the top of the page
  rule(dom('img').when(isAboveTheFold), type('imageish')),
  // better score for larger images
  rule(type('imageish'), score(largerImage)),
  // return image element with max score
  rule(type('imageish').max(), out('image')),

  /**
  * Title rules
  */
  // consider only the title element
  rule(dom('title'), type('titleish')),
  // give the title element the minimum score
  rule(type('titleish'), score(() => SCORE_THRESHOLD)),
  // return title element with max score
  rule(type('titleish').max(), out('title')),

  /**
  * Price rules
  */
  // consider all span and h2 elements near the top of the page
  rule(dom('span, h2').when(isAboveTheFold), type('priceish')),
  // check if the element has a '$' in its innerText
  rule(type('priceish'), score(hasDollarSign)),
  // better score for larger font size
  rule(type('priceish'), score(largerFontSize)),
  // return price element with max score
  rule(type('priceish').max(), out('price')),
);

/**
 * Extracts the highest scoring element above a score threshold
 * contained in a page's HTML document.
 */
function runRuleset(doc) {
  const extractedElements = {};
  for (const feature of PRODUCT_FEATURES) {
    let fnodesList = rules.against(doc).get(`${feature}`);
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

// Trim off the shorter substring between ' - ', ': ' or ' | '
function trimTitle(title) {
  let textArr = [];
  // TODO: This currently cuts of the " - Black" substring on E-bay
  if (title.includes(' - ')) {
    textArr = title.split(' - ');
  }
  if (title.includes(': ')) {
    textArr = title.split(': ');
  }
  if (textArr.length >= 1) {
    return textArr.reduce((a, b) => ((a.length > b.length) ? a : b));
  }
  return title;
}

/**
 * Takes a price string of the form "$1997 /each" and turns
 * it into "$19.97".
 * TODO: Can this be generalized/simplified? This is very specific
 * to Home Depot's product pages.
 */
function formatPrice(price) {
  let formattedPrice = price;
  if (price.includes('/')) {
    const index = price.indexOf('/');
    formattedPrice = price.slice(0, index);
    formattedPrice = formattedPrice.trim();
    const decimalIndex = formattedPrice.length - 2;
    const rightSide = formattedPrice.substring(decimalIndex);
    const leftSide = formattedPrice.replace(rightSide, '');
    formattedPrice = `${leftSide}.${rightSide}`;
  }
  return formattedPrice;
}

/*
 * Run the ruleset for the product features against the current window document
 */
export default function extractProduct(doc) {
  const extractedProduct = {};
  const extractedElements = runRuleset(doc);
  if (hasAllFeatures(extractedElements)) {
    for (const feature of PRODUCT_FEATURES) {
      let text = extractedElements[feature].innerText;
      if (feature === 'title') {
        text = trimTitle(text);
      }
      if (feature === 'price') {
        text = formatPrice(text);
      }
      extractedProduct[feature] = (feature === 'image'
        ? extractedElements[feature].src
        : text
      );
    }
  }
  return hasAllFeatures(extractedProduct) ? extractedProduct : null;
}
