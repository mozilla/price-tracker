/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {dom, out, rule, ruleset, score, type} from 'fathom-web';
// For training, replace 'utils' with 'utilsForFrontend'. The mozilla/fathom-trainees
// add-on currently imports Fathom as a submodule
import {ancestors} from 'fathom-web/utils';
import {SCORE_THRESHOLD} from 'commerce/config';

const DEFAULT_BODY_FONT_SIZE = 14;
const DEFAULT_SCORE = 1;
const TOP_BUFFER = 150;
// Taken from: https://github.com/mozilla/fathom-trainees/blob/master/src/trainees.js
const ZEROISH = 0.08;
const ONEISH = 0.9;

/**
 * Rulesets to train.
 *
 * Drop this file into the fathom-trainees/src folder (replacing the default file)
 * to train Fathom against this ruleset.
 *
 * More mechanically, a map of names to {coeffs, rulesetMaker} objects.
 * rulesetMaker is a function that takes an Array of coefficients and returns a
 * ruleset that uses them. coeffs is typically the best-yet-found coefficients
 * for a ruleset but can also be some more widely flung ones that you want to
 * start the trainer from. The rulesets you specify here show up in the Train
 * UI, from which you can kick off a training run.
 *
 * Fathom notes:
 * - The FathomFox Trainer assumes that the value of your corpus' `data-fathom`
 *   attribute is the same as the `out`-ed string. Example: An element tagged with
 *   `data-fathom="image"` will map to `rule(..., out("image"))`.
 * - I would not recommend using the Corpus Collector to build up a training set,
 *   because you can only batch freeze original pages, meaning tagged pages would be
 *   re-freezed, and there are non-obvious side effects in the diff (an issue with
 *   the freeze-dried library Fathom uses).
 */

const trainees = new Map();

trainees.set(
  /**
   * A ruleset that finds the main product title, image and price on a product page.
   * IMPORTANT: Currently, the Trainer assumes that the name of the ruleset and the
   * out-rule of interest are the same. A multi-out ruleset will not work without
   * commenting out all but one `out` and setting the ruleset name to that `out`.
   */
  'product', // Ruleset name: 'product' for production and 'title', 'image' or 'price' for training
  {
    // For training only: input rule coefficients in order here
    coeffs: [2, 7, 8, 17, 2, 33, 13, 5, 5, 15],
    rulesetMaker([
      largerImageCoeff,
      largerFontSizeCoeff,
      hasDollarSignCoeff,
      hasPriceInIDCoeff,
      hasPriceInClassNameCoeff,
      isAboveTheFoldPriceCoeff,
      isAboveTheFoldImageCoeff,
      isNearbyImageXAxisPriceCoeff,
      isNearbyImageYAxisTitleCoeff,
      hasPriceishPatternCoeff,
    ]) {
      /**
       * Scores fnode in direct proportion to its size
       */
      function largerImage(fnode) {
        const domRect = fnode.element.getBoundingClientRect();
        const area = (domRect.width) * (domRect.height);
        if (area === 0) {
          return DEFAULT_SCORE;
        }
        return area * largerImageCoeff;
      }

      /**
       * Scores fnode in proportion to its font size
       */
      function largerFontSize(fnode) {
        const size = window.getComputedStyle(fnode.element).fontSize;
        // normalize the multiplier by the default font size
        const sizeMultiplier = parseFloat(size, 10) / DEFAULT_BODY_FONT_SIZE;
        return sizeMultiplier * largerFontSizeCoeff;
      }

      /**
       * Scores fnode with a '$' in its innerText
       */
      function hasDollarSign(fnode) {
        if (fnode.element.innerText.includes('$')) {
          return hasDollarSignCoeff;
        }
        return DEFAULT_SCORE;
      }

      /**
       * Scores fnode with 'price' in its id or its parent's id
       */
      function hasPriceInID(fnode) {
        const id = fnode.element.id;
        const parentID = fnode.element.parentElement.id;
        if (id.toLowerCase().includes('price')) {
          return hasPriceInIDCoeff;
        }
        if (parentID.toLowerCase().includes('price')) {
          return 0.75 * hasPriceInIDCoeff;
        }
        return DEFAULT_SCORE;
      }

      /**
       * Scores fnode with 'price' in its class name or its parent's class name
       */
      function hasPriceInClassName(fnode) {
        const className = fnode.element.className;
        const parentClassName = fnode.element.parentElement.className;
        if (className.toLowerCase().includes('price')) {
          return hasPriceInClassNameCoeff;
        }
        if (parentClassName.toLowerCase().includes('price')) {
          return 0.75 * hasPriceInClassNameCoeff;
        }
        return DEFAULT_SCORE;
      }

      function isVisible(fnode) {
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
       * Scores fnode by its vertical location relative to the fold
       */
      function isAboveTheFold(fnode, featureCoeff) {
        const viewportHeight = window.innerHeight;
        const top = fnode.element.getBoundingClientRect().top;
        const upperHeightLimit = viewportHeight * 2;
        // Use a falling trapezoid function to score the element
        // Taken from: https://github.com/mozilla/fathom-trainees
        if (top >= upperHeightLimit) {
          return ZEROISH * featureCoeff;
        }
        if (top <= viewportHeight) {
          return ONEISH * featureCoeff;
        }
        // slope = deltaY / deltaX
        const slope = (ONEISH - ZEROISH) / (viewportHeight - upperHeightLimit);
        // y = mx + b, where m = slope and b = y-intercept
        return (slope * (top - upperHeightLimit) + ZEROISH) * featureCoeff;
      }

      /**
       * Checks to see if a 'priceish' fnode is eligible for scoring
       * Note: This is a compound method, because `.when` chaining these methods
       * onto a `dom` rule does not currently work. i.e.
       * `rule(dom('span, h2')
       *        .when(isVisible)
       *        .when(hasDifferentInnerTextThanChildren)
       *        .when(isNearbyImageYAxisPrice)),
       *        type('priceish')),`
       * ...is replaced with:
       * `rule(dom('span, h2').when(isEligiblePrice), type('priceish')),`
       */
      function isEligiblePrice(fnode) {
        return (
          isVisible(fnode)
          && hasDifferentInnerTextThanChildren(fnode)
          && isNearbyImageYAxisPrice(fnode)
        );
      }

      /**
       * Checks to see if a 'titleish' fnode is eligible for scoring
       */
      function isEligibleTitle(fnode) {
        return (
          isVisible(fnode)
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
      function hasDifferentInnerTextThanChildren(fnode) {
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
       * Scores fnode based on its x distance from the highest scoring image element
       */
      function isNearbyImageXAxisPrice(fnode) {
        const viewportWidth = window.innerWidth;
        const eleDOMRect = fnode.element.getBoundingClientRect();
        const imageElement = fnode._ruleset.get('image')[0].element; // eslint-disable-line no-underscore-dangle
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
          // give a higher score the closer it is to the image, normalized by viewportWidth
          return (viewportWidth / deltaX) * isNearbyImageXAxisPriceCoeff;
        }
        return DEFAULT_SCORE;
      }

      /**
       * Scores fnode whose innerText matches a priceish RegExp pattern
       */
      function hasPriceishPattern(fnode) {
        const text = fnode.element.innerText;
        /**
         * With an optional '$' that doesn't necessarily have to be at the beginning
         * of the string (ex: 'US $5.00' on Ebay), matches any number of digits before
         * a decimal point and exactly two after, where the two digits after the decimal point
         * are at the end of the string
         */
        const regExp = /\${0,1}\d+\.\d{2}$/;
        if (regExp.test(text)) {
          return hasPriceishPatternCoeff;
        }
        return DEFAULT_SCORE;
      }

      /**
       * Scores fnode based on its y distance from the highest scoring image element
       */
      function isNearbyImageYAxisTitle(fnode) {
        const viewportHeight = window.innerHeight;
        const DOMRect = fnode.element.getBoundingClientRect();
        const imageElement = fnode._ruleset.get('image')[0].element; // eslint-disable-line no-underscore-dangle
        const imageDOMRect = imageElement.getBoundingClientRect();
        // Some titles (like on Ebay) are above the image, so include a top buffer
        const isEleTopNearby = DOMRect.top >= (imageDOMRect.top - TOP_BUFFER);
        const isEleBottomNearby = DOMRect.bottom <= imageDOMRect.bottom;
        // Give elements in a specific vertical band a higher score
        if (isEleTopNearby && isEleBottomNearby) {
          const deltaY = Math.abs(imageDOMRect.top - DOMRect.top);
          // give a higher score the closer it is to the image, normalized by viewportHeight
          return (viewportHeight / deltaY) * isNearbyImageYAxisTitleCoeff;
        }
        return DEFAULT_SCORE;
      }

      /**
       * Checks if fnode is nearby the top scoring image element in the y-axis
       */
      function isNearbyImageYAxisPrice(fnode) {
        const element = fnode.element;
        const DOMRect = element.getBoundingClientRect();
        const imageElement = fnode._ruleset.get('image')[0].element; // eslint-disable-line no-underscore-dangle
        const imageDOMRect = imageElement.getBoundingClientRect();
        if (DOMRect.top >= (imageDOMRect.top - TOP_BUFFER)
          && DOMRect.bottom <= imageDOMRect.bottom) {
          return true;
        }
        return false;
      }

      /* The ruleset */
      const rules = ruleset(
        /**
         * Image rules
         */
        // consider all visible img elements
        rule(dom('img').when(isVisible), type('imageish')),
        // better score the closer the element is to the top of the page
        rule(type('imageish'), score(fnode => isAboveTheFold(fnode, isAboveTheFoldImageCoeff))),
        // better score for larger images
        rule(type('imageish'), score(largerImage)),
        // return image element(s) with max score
        rule(type('imageish').max(), out('image')),

        /**
        * Title rules
        */
        // consider all eligible h1 elements
        rule(dom('h1').when(isEligibleTitle), type('titleish')),
        // better score based on y-axis proximity to max scoring image element
        rule(type('titleish'), score(isNearbyImageYAxisTitle)),
        // since no further rules are needed for title, give all inputs the minimum score
        rule(type('titleish'), score(() => SCORE_THRESHOLD)),
        // return title element(s) with max score
        rule(type('titleish').max(), out('title')),

        /**
        * Price rules
        */
        // consider all eligible span and h2 elements
        rule(dom('span, h2').when(isEligiblePrice), type('priceish')),
        // check if the element has a '$' in its innerText
        rule(type('priceish'), score(hasDollarSign)),
        // better score the closer the element is to the top of the page
        rule(type('priceish'), score(fnode => isAboveTheFold(fnode, isAboveTheFoldPriceCoeff))),
        // check if the id has "price" in it
        rule(type('priceish'), score(hasPriceInID)),
        // check if any class names have "price" in them
        rule(type('priceish'), score(hasPriceInClassName)),
        // better score for larger font size
        rule(type('priceish'), score(largerFontSize)),
        // better score based on x-axis proximity to max scoring image element
        rule(type('priceish'), score(isNearbyImageXAxisPrice)),
        // check if innerText has a priceish pattern
        rule(type('priceish'), score(hasPriceishPattern)),
        // return price element(s) with max score
        rule(type('priceish').max(), out('price')),
      );
      return rules;
    },
  },
);

export default trainees;
