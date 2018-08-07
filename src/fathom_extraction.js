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
const SCORE_THRESHOLD = 4;
const DEFAULT_BODY_FONT_SIZE = 14;
const DEFAULT_SCORE = 1;
const VIEWPORT_HEIGHT = window.innerHeight;

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
  const sizeWithUnits = window.getComputedStyle(fnode.element).fontSize;
  const size = sizeWithUnits.replace('px', '');
  if (size) {
    // normalize the multiplier by the default font size
    const sizeMultiplier = parseInt(size, 10) / DEFAULT_BODY_FONT_SIZE;
    return (sizeMultiplier * fathomCoeffs.largerFontSize);
  }
  return DEFAULT_SCORE;
}

/**
 * Scores fnode with "title" in its id
 */
function hasTitleInID(fnode) {
  const id = fnode.element.id;
  if (id.includes('title') || id.includes('Title')) {
    return fathomCoeffs.hasTitleInID;
  }
  return DEFAULT_SCORE;
}

/**
 * Scores fnode with "title" in a class name
 */
function hasTitleInClassName(fnode) {
  const className = fnode.element.className;
  if (className.includes('title') || className.includes('Title')) {
    return fathomCoeffs.hasTitleInClassName;
  }
  return DEFAULT_SCORE;
}

/**
 * Scores fnode that is hidden
 */
function isHidden(fnode) {
  const element = fnode.element;
  const style = window.getComputedStyle(element);
  if (!element.offsetParent // null if the offsetParent has a display set to "none"
    || style.visibility === 'hidden'
    || style.opacity === '0'
    || style.width === '0'
    || style.height === '0') {
    return fathomCoeffs.isHidden;
  }
  return DEFAULT_SCORE;
}

/**
 * Scores fnode that is an H1 element
 */
function isHeaderElement(fnode) {
  if (fnode.element.tagName === 'H1') {
    return fathomCoeffs.isHeaderElement;
  }
  return DEFAULT_SCORE;
}

/**
 * Ruleset for product features; each feature has its own type.
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
  // consider all h1 and span elements near the top of the page
  rule(dom('h1, span').when(isAboveTheFold), type('titleish')),
  // score higher for h1 elements
  rule(type('titleish'), score(isHeaderElement)),
  // check if the id has "title" in it
  rule(type('titleish'), score(hasTitleInID)),
  // check if any class names have "title" in them
  rule(type('titleish'), score(hasTitleInClassName)),
  // better score for larger font size
  rule(type('titleish'), score(largerFontSize)),
  // reduce score if element is hidden
  rule(type('titleish'), score(isHidden)),
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
  // reduce score if element is hidden
  rule(type('priceish'), score(isHidden)),
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

/*
 * Run the ruleset for the product features against the current window document
 */
export default function extractProduct(doc) {
  const extractedProduct = {};
  const extractedElements = runRuleset(doc);
  if (hasAllFeatures(extractedElements)) {
    for (const feature of PRODUCT_FEATURES) {
      extractedProduct[feature] = (feature === 'image'
        ? extractedElements[feature].src
        : extractedElements[feature].innerText
      );
    }
  }
  return hasAllFeatures(extractedProduct) ? extractedProduct : null;
}
