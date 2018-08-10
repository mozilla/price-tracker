/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {dom, out, rule, ruleset, score, type} from 'fathom-web';
import {ancestors} from 'fathom-web/utils'; // for training: utilsForFrontend

const DEFAULT_BODY_FONT_SIZE = 14;
const DEFAULT_SCORE = 1;
const SCORE_THRESHOLD = 4;
const TOP_BUFFER = 150;
const VIEWPORT_HEIGHT = window.innerHeight;
const VIEWPORT_WIDTH = window.innerWidth;
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
    coeffs: [2, 7, 8, 17, 2, 33, 13, 5, 15],
    rulesetMaker([
      largerImageCoeff,
      largerFontSizeCoeff,
      hasDollarSignCoeff,
      hasPriceInIDCoeff,
      hasPriceInClassNameCoeff,
      isAboveTheFoldPriceCoeff,
      isAboveTheFoldImageCoeff,
      isNearbyImageXAxisCoeff,
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
        const sizeWithUnits = window.getComputedStyle(fnode.element).fontSize;
        const size = sizeWithUnits.replace('px', '');
        if (size) {
          // normalize the multiplier by the default font size
          const sizeMultiplier = parseInt(size, 10) / DEFAULT_BODY_FONT_SIZE;
          return (sizeMultiplier * largerFontSizeCoeff);
        }
        return DEFAULT_SCORE;
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
        const element = fnode.element;
        const parentElement = element.parentElement;
        const ID = element.id;
        const parentID = parentElement.id;
        if (ID.includes('price') || ID.includes('Price')) {
          return hasPriceInIDCoeff;
        }
        if (parentID.includes('price') || parentID.includes('Price')) {
          return 0.75 * hasPriceInIDCoeff;
        }
        return DEFAULT_SCORE;
      }

      /**
       * Scores fnode with 'price' in its class name or its parent's class name
       */
      function hasPriceInClassName(fnode) {
        const element = fnode.element;
        const parentElement = element.parentElement;
        const className = element.className;
        const parentClassName = parentElement.className;
        if (className.includes('price') || className.includes('Price')) {
          return hasPriceInClassNameCoeff;
        }
        if (parentClassName.includes('price') || parentClassName.includes('Price')) {
          return 0.75 * hasPriceInClassNameCoeff;
        }
        return DEFAULT_SCORE;
      }

      /**
       * Checks if fnode is visible
       */
      function isVisible(fnode) {
        const element = fnode.element;
        for (const ancestor of ancestors(element)) {
          const style = getComputedStyle(ancestor);
          if (style.visibility === 'hidden'
            || style.display === 'none'
            || style.opacity === '0'
            || style.width === '0'
            || style.height === '0') {
            return false;
          }
        }
        return true;
      }

      /**
       * Scale a number to the range [ZEROISH, ONEISH].
       *
       * Taken from: https://github.com/mozilla/fathom-trainees
       *
       * For a rising trapezoid, the result is ZEROISH until the input
       * reaches zeroAt, then increases linearly until oneAt, at which it
       * becomes ONEISH. To make a falling trapezoid, where the result is
       * ONEISH to the left and ZEROISH to the right, use a zeroAt greater
       * than oneAt.
       */
      function trapezoid(number, zeroAt, oneAt) {
        const isRising = zeroAt < oneAt;
        if (isRising) {
          if (number <= zeroAt) {
            return ZEROISH;
          }
          if (number >= oneAt) {
            return ONEISH;
          }
        } else {
          if (number >= zeroAt) {
            return ZEROISH;
          }
          if (number <= oneAt) {
            return ONEISH;
          }
        }
        const slope = (ONEISH - ZEROISH) / (oneAt - zeroAt);
        return slope * (number - zeroAt) + ZEROISH;
      }

      /**
       * Scores fnode by its vertical location relative to the fold
       */
      function isAboveTheFold(fnode, featureCoeff) {
        const domRect = fnode.element.getBoundingClientRect();
        // Use a falling trapezoid to score the element;
        // result is ONEISH until the input reaches VIEWPORT_HEIGHT, then decreases
        // linearly until VIEWPORT_HEIGHT * 2, where it becomes ZEROISH.
        return trapezoid(domRect.top, VIEWPORT_HEIGHT * 2, VIEWPORT_HEIGHT) * featureCoeff;
      }

      /**
       * Checks to see if fnode is eligible for scoring
       * Note: This is a compound method, because `.when` chaining these methods onto
       * a `dom` rule does not currently work.
       */
      function isEligible(fnode, featureType) {
        if (featureType === 'priceish') {
          return (
            isVisible(fnode)
            && removeRedundantAncestors(fnode)
            && isNearbyImageYAxis(fnode)
          );
        }
        if (featureType === 'titleish') {
          return (
            isVisible(fnode)
            /**
             * Don't removeRedundantAncestors, because <h1> tags for
             * Amazon and Walmart have <span> and <div> element children,
             * respectively, with the same innerText.
             */
            && isNearbyImageYAxis(fnode)
          );
        }
        return false;
      }

      /**
       * Checks if fnode has the same innerText as any of its children
       */
      function removeRedundantAncestors(fnode) {
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
      function isNearbyImageXAxis(fnode) {
        const element = fnode.element;
        const eleDOMRect = element.getBoundingClientRect();
        const imageElement = fnode._ruleset.get('image')[0].element; // eslint-disable-line no-underscore-dangle
        const imageDOMRect = imageElement.getBoundingClientRect();
        const deltaX = eleDOMRect.left - imageDOMRect.right;
        // priceish element is always* to the right of the image
        if (deltaX > 0) {
          // give a higher score the closer it is to the image, normalized by VIEWPORT_WIDTH
          return (VIEWPORT_WIDTH / deltaX) * isNearbyImageXAxisCoeff;
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
       * Checks if fnode is nearby the top scoring image element in the y-axis
       */
      function isNearbyImageYAxis(fnode) {
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
         *
         * If training, leave uncommented, as 'price' and 'title' rules depend
         * on the `out` of these 'image' rules.
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
        *
        * If training, comment out unless training 'title'.
        */
        // consider all eligible h1 elements
        rule(dom('h1').when(fnode => isEligible(fnode, 'titleish')), type('titleish')),
        // since no further rules are needed for title, give all inputs the minimum score
        rule(type('titleish'), score(() => SCORE_THRESHOLD)),
        // return title element(s) with max score
        rule(type('titleish').max(), out('title')),

        /**
        * Price rules
        *
        * If training, comment out unless training 'price'.
        */
        // consider all eligible span and h2 elements
        rule(dom('span, h2').when(fnode => isEligible(fnode, 'priceish')), type('priceish')),
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
        // check for x-axis proximity to max scoring image element
        rule(type('priceish'), score(isNearbyImageXAxis)),
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
