/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {dom, out, rule, ruleset, score, type} from 'fathom-web';

const DEFAULT_BODY_FONT_SIZE = 14;
const DEFAULT_SCORE = 1;
const VIEWPORT_HEIGHT = window.innerHeight;

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
  'product', // 'product' for production and 'title', 'image' or 'price' for training
  {
    coeffs: [3, 1, 3, 10, 5, -100, 10], // Input rule coefficients in order here
    rulesetMaker([
      coeffLargerImage,
      coeffLargerFontSize,
      coeffHasDollarSign,
      coeffHasTitleInID,
      coeffHasTitleInClassName,
      coeffIsHidden,
      coeffIsHeaderElement,
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
        return area * coeffLargerImage;
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
          return (sizeMultiplier * coeffLargerFontSize);
        }
        return DEFAULT_SCORE;
      }

      /**
       * Scores fnode with a '$' in its innerText
       */
      function hasDollarSign(fnode) {
        if (fnode.element.innerText.includes('$')) {
          return coeffHasDollarSign;
        }
        return DEFAULT_SCORE;
      }

      /**
       * Scores fnode with "title" in its id
       */
      function hasTitleInID(fnode) {
        const id = fnode.element.id;
        if (id.includes('title') || id.includes('Title')) {
          return coeffHasTitleInID;
        }
        return DEFAULT_SCORE;
      }

      /**
       * Scores fnode with "title" in a class name
       */
      function hasTitleInClassName(fnode) {
        const className = fnode.element.className;
        if (className.includes('title') || className.includes('Title')) {
          return coeffHasTitleInClassName;
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
          return coeffIsHidden;
        }
        return DEFAULT_SCORE;
      }

      /**
       * Scores fnode that is an H1 element
       */
      function isHeaderElement(fnode) {
        if (fnode.element.tagName === 'H1') {
          return coeffIsHeaderElement;
        }
        return DEFAULT_SCORE;
      }

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

      /* The actual ruleset */
      const rules = ruleset(
        /**
         * Image rules
         *
         * If training, comment out unless training 'image'.
         */
        // consider all img elements near the top of the page
        rule(dom('img').when(isAboveTheFold), type('imageish')),
        // better score for larger images
        rule(type('imageish'), score(largerImage)),
        // return image element with max score
        rule(type('imageish').max(), out('image')),

        /**
        * Title rules
        *
        * If training, comment out unless training 'title'.
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
        *
        * If training, comment out unless training 'price'.
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
      return rules;
    },
  },
);

export default trainees;
