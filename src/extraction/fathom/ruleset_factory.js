/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {dom, out, rule, ruleset, score, type} from 'fathom-web';
// Since the fathom-trainees add-on currently uses a submodule of Fathom, for
// training, replace 'utils' with 'utilsForFrontend'
import {ancestors} from 'fathom-web/utilsForFrontend';

const DEFAULT_BODY_FONT_SIZE = 14;
const DEFAULT_SCORE = 1;
const TOP_BUFFER = 150;
// From: https://github.com/mozilla/fathom-trainees/blob/master/src/trainees.js
const ZEROISH = 0.08;
const ONEISH = 0.9;

/**
 * Creates Fathom ruleset instances, and holds individual rule methods for
 * easier testing.
 */
export default class RulesetFactory {
  /**
   * @param {number[]} coefficients
   */
  constructor(coefficients) {
    [
      this.hasDollarSignCoeff,
      this.hasPriceInClassNameCoeff,
      this.hasPriceInIDCoeff,
      this.hasPriceishPatternCoeff,
      this.isAboveTheFoldImageCoeff,
      this.isAboveTheFoldPriceCoeff,
      this.isNearbyImageXAxisPriceCoeff,
      this.isNearbyImageYAxisTitleCoeff,
      this.largerFontSizeCoeff,
      this.largerImageCoeff,
    ] = coefficients;
  }

  /**
   * Scores fnode in direct proportion to its size
   */
  largerImage(fnode) {
    const domRect = fnode.element.getBoundingClientRect();
    const area = domRect.width * domRect.height;

    // Assume no product images as small as 80px^2. No further bonus over
    // 1000^2. For one thing, that's getting into background image territory
    // (though we should have distinct penalties for that sort of thing if we
    // care). More importantly, clamp the upper bound of the score so we don't
    // overcome other bonuses and penalties.
    return trapezoid(area, 80 ** 2, 1000 ** 2) ** this.largerImageCoeff;
  }

  /**
   * Scores fnode in proportion to its font size
   */
  largerFontSize(fnode) {
    const size = window.getComputedStyle(fnode.element).fontSize;
    // Normalize the multiplier by the default font size
    const sizeMultiplier = parseFloat(size, 10) / DEFAULT_BODY_FONT_SIZE;
    return sizeMultiplier * this.largerFontSizeCoeff;
  }

  /**
   * Scores fnode with a '$' in its innerText
   */
  hasDollarSign(fnode) {
    if (fnode.element.innerText.includes('$')) {
      return this.hasDollarSignCoeff;
    }
    return DEFAULT_SCORE;
  }

  /**
   * Scores fnode with 'price' in its id or its parent's id
   */
  hasPriceInID(fnode) {
    const id = fnode.element.id;
    const parentID = fnode.element.parentElement.id;
    if (id.toLowerCase().includes('price')) {
      return this.hasPriceInIDCoeff;
    }
    if (parentID.toLowerCase().includes('price')) {
      return 0.75 * this.hasPriceInIDCoeff;
    }
    return DEFAULT_SCORE;
  }

  /**
   * Scores fnode with 'price' in its class name or its parent's class name
   */
  hasPriceInClassName(fnode) {
    const className = fnode.element.className;
    const parentClassName = fnode.element.parentElement.className;
    if (className.toLowerCase().includes('price')) {
      return this.hasPriceInClassNameCoeff;
    }
    if (parentClassName.toLowerCase().includes('price')) {
      return 0.75 * this.hasPriceInClassNameCoeff;
    }
    return DEFAULT_SCORE;
  }

  /**
   * Scores fnode by its vertical location relative to the fold
   */
  isAboveTheFold(fnode, featureCoeff) {
    const viewportHeight = window.innerHeight;
    const imageTop = fnode.element.getBoundingClientRect().top;

    // Stop giving additional bonus for anything closer than 200px to the top
    // of the viewport. Those are probably usually headers.
    return trapezoid(imageTop, viewportHeight * 2, 200) ** featureCoeff;
  }

  /**
   * Scores fnode based on its x distance from the highest scoring image element
   */
  isNearbyImageXAxisPrice(fnode) {
    const viewportWidth = window.innerWidth;
    const eleDOMRect = fnode.element.getBoundingClientRect();
    const imageElement = this.getHighestScoringImage(fnode);
    const imageDOMRect = imageElement.getBoundingClientRect();
    const deltaRight = eleDOMRect.left - imageDOMRect.right;
    const deltaLeft = imageDOMRect.left - eleDOMRect.right;
    // True if element is completely to the right or left of the image element
    const noOverlap = (deltaRight > 0 || deltaLeft > 0);
    let deltaX;
    if (noOverlap) {
      if (deltaRight > 0) {
        deltaX = deltaRight;
      } else {
        deltaX = deltaLeft;
      }
      // Give a higher score the closer it is to the image, normalized by viewportWidth
      return (viewportWidth / deltaX) * this.isNearbyImageXAxisPriceCoeff;
    }
    return DEFAULT_SCORE;
  }

  /**
   * Return whether the potential title is near the top or bottom of the
   * highest-scoring image.
   *
   * This is a makeshift ORing 2 signals: a "near the top" and a "near the
   * bottom" one.
   */
  isNearImageTopOrBottom(fnode) {
    const image = this.getHighestScoringImage(fnode);
    const imageRect = image.getBoundingClientRect();
    const nodeRect = fnode.element.getBoundingClientRect();

    // Should cover title above image and title in a column next to image.
    // Could also consider using the y-axis midpoint of title.
    const topDistance = Math.abs(imageRect.top - nodeRect.top);

    // Test nodeRect.top. They're probably not side by side with the title at
    // the bottom. Rather, title will be below image.
    const bottomDistance = Math.abs(imageRect.bottom - nodeRect.top);

    const shortestDistance = Math.min(topDistance, bottomDistance);
    return trapezoid(shortestDistance, 200, 0) ** this.isNearbyImageYAxisTitleCoeff;
  }

  /**
   * Scores fnode whose innerText matches a priceish RegExp pattern
   */
  hasPriceishPattern(fnode) {
    const text = fnode.element.innerText;
    /**
     * With an optional '$' that doesn't necessarily have to be at the beginning
     * of the string (ex: 'US $5.00' on Ebay), matches any number of digits before
     * a decimal point and exactly two after, where the two digits after the decimal point
     * are at the end of the string
     */
    const regExp = /\$?\d+\.\d{2}$/;
    if (regExp.test(text)) {
      return this.hasPriceishPatternCoeff;
    }
    return DEFAULT_SCORE;
  }

  /**
   * Checks to see if a 'priceish' fnode is eligible for scoring
   */
  isEligiblePrice(fnode) {
    return (
      this.isVisible(fnode)
      && this.hasDifferentInnerTextThanChildren(fnode)
      && this.isNearbyImageYAxisPrice(fnode)
    );
  }

  /**
   * Checks to see if a 'titleish' fnode is eligible for scoring
   */
  isEligibleTitle(fnode) {
    return (
      this.isVisible(fnode)
      // Don't use hasDifferentInnerTextThanChildren, because <h1> tags
      // for Amazon and Walmart have <span> and <div> element children,
      // respectively, with the same innerText.
      //
      // Don't use isNearbyImageYAxisTitle here, as unlike for price, there
      // is a strong correlation for vertical proximity to image, so we want
      // to score it proportionally rather than have a hard cut-off.
    );
  }

  /**
   * Checks if fnode has different innerText compared to any of its children
   */
  hasDifferentInnerTextThanChildren(fnode) {
    const element = fnode.element;
    const children = element.children;
    if (children.length > 0) {
      for (const descendant of children) {
        if (descendant.innerText === element.innerText) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Checks if fnode is nearby the top scoring image element in the y-axis
   * Unlike for 'title', 'price' elements had worse accuracy when scored
   * in proportion to y-axis proximity to the image.
   */
  isNearbyImageYAxisPrice(fnode) {
    const element = fnode.element;
    const DOMRect = element.getBoundingClientRect();
    const imageElement = this.getHighestScoringImage(fnode);
    const imageDOMRect = imageElement.getBoundingClientRect();
    if (DOMRect.top >= (imageDOMRect.top - TOP_BUFFER)
      && DOMRect.bottom <= imageDOMRect.bottom) {
      return true;
    }
    return false;
  }

  isVisible(fnode) {
    for (const ancestor of ancestors(fnode.element)) {
      const style = getComputedStyle(ancestor);
      const isElementHidden = (
        style.visibility === 'hidden'
        || style.display === 'none'
        || style.opacity === '0'
        || style.width === '0'
        || style.height === '0'
      );
      if (isElementHidden) {
        return false;
      }
    }
    return true;
  }

  /**
  * Using coefficients passed into the constructor method, returns a weighted
  * ruleset used to score elements in an HTML document.
  */
  makeRuleset() {
    return ruleset(
      /**
       * Image rules
       */
      // consider all visible img elements
      rule(dom('img').when(this.isVisible.bind(this)), type('imageish')),
      // better score the closer the element is to the top of the page
      rule(type('imageish'), score(fnode => this.isAboveTheFold(fnode, this.isAboveTheFoldImageCoeff))),
      // better score for larger images
      rule(type('imageish'), score(this.largerImage.bind(this))),
      // return image element(s) with max score
      rule(type('imageish').max(), out('image')),

      /**
      * Title rules
      */
      // consider all eligible h1 elements
      rule(dom('h1').when(this.isEligibleTitle.bind(this)), type('titleish')),
      // better score based on y-axis proximity to max scoring image element
      rule(type('titleish'), score(this.isNearImageTopOrBottom.bind(this))),
      // return title element(s) with max score
      rule(type('titleish').max(), out('title')),

      /**
      * Price rules
      */
      // consider all eligible span and h2 elements
      rule(dom('span, h2').when(this.isEligiblePrice.bind(this)), type('priceish')),
      // check if the element has a '$' in its innerText
      rule(type('priceish'), score(this.hasDollarSign.bind(this))),
      // better score the closer the element is to the top of the page
      rule(type('priceish'), score(fnode => this.isAboveTheFold(fnode, this.isAboveTheFoldPriceCoeff))),
      // check if the id has "price" in it
      rule(type('priceish'), score(this.hasPriceInID.bind(this))),
      // check if any class names have "price" in them
      rule(type('priceish'), score(this.hasPriceInClassName.bind(this))),
      // better score for larger font size
      rule(type('priceish'), score(this.largerFontSize.bind(this))),
      // better score based on x-axis proximity to max scoring image element
      rule(type('priceish'), score(this.isNearbyImageXAxisPrice.bind(this))),
      // check if innerText has a priceish pattern
      rule(type('priceish'), score(this.hasPriceishPattern.bind(this))),
      // return price element(s) with max score
      rule(type('priceish').max(), out('price')),
    );
  }

  /**
   * Takes in a coefficients object and returns a coefficients array in the
   * same order.
   */
  static getCoeffsInOrder(coeffsObj) {
    const coeffsKeys = Object.keys(coeffsObj);
    coeffsKeys.sort(); // sort keys in string Unicode order
    const coeffs = [];
    for (const key of coeffsKeys) {
      coeffs.push(coeffsObj[key]);
    }
    return coeffs;
  }

  getHighestScoringImage(fnode) {
    return fnode._ruleset.get('image')[0].element; // eslint-disable-line no-underscore-dangle
  }
}

/**
 * Scale a number to the range [ZEROISH, ONEISH].
 *
 * For a rising trapezoid, the result is ZEROISH until the input reaches
 * zeroAt, then increases linearly until oneAt, at which it becomes ONEISH. To
 * make a falling trapezoid, where the result is ONEISH to the left and ZEROISH
 * to the right, use a zeroAt greater than oneAt.
 */
function trapezoid(number, zeroAt, oneAt) {
    const isRising = zeroAt < oneAt;
    if (isRising) {
        if (number <= zeroAt) {
            return ZEROISH;
        } else if (number >= oneAt) {
            return ONEISH;
        }
    } else {
        if (number >= zeroAt) {
            return ZEROISH;
        } else if (number <= oneAt) {
            return ONEISH;
        }
    }
    const slope = (ONEISH - ZEROISH) / (oneAt - zeroAt);
    return slope * (number - zeroAt) + ZEROISH;
}
