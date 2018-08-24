/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* eslint-disable import/no-unresolved */
// This file is moved up a level to the ./src folder for training
import defaultCoefficients from './extraction/fathom_default_coefficients.json';
import RulesetFactory from './extraction/ruleset_factory';

// Array of numbers corresponding to the coefficients in order
const coeffs = RulesetFactory.getCoeffsInOrder(defaultCoefficients);

/**
 * Rulesets to train using Fathom.
 *
 * More mechanically, a map of names to {coeffs, rulesetMaker} objects.
 * rulesetMaker is a function that takes an Array of coefficients and returns a
 * ruleset that uses them. coeffs is typically the best-yet-found coefficients
 * for a ruleset but can also be some more widely flung ones that you want to
 * start the trainer from. The rulesets you specify here show up in the Train
 * UI, from which you can kick off a training run.
 *
 * How to train:
 *  1. Fork the `mozilla/fathom-trainees` repo,
 *  2. In the `fathom-trainees` add-on, copy this file and `config.js` over to the
 *  `./src` folder, and copy `./extraction/fathom_default_coefficients.json` and
 *  `./extraction/ruleset_factory.js` to a new `./src/extraction` subfolder.
 *    * Note: You will have to replace 'utils' with 'utilsForFrontend' on the
 *      import in `ruleset_factory.js`. See that file for more information.
 *  3. Follow instructions at: https://github.com/erikrose/fathom-fox#the-trainer.
 *
 * Notes:
 * - The FathomFox Trainer assumes that the value of your corpus' `data-fathom`
 *   attribute is the same as the `out`-ed string. Example: An element tagged with
 *   `data-fathom="image"` will map to `rule(..., out("image"))`.
 * - The Trainer assumes that the name of the ruleset and the out-rule of interest
 *   are the same. Therefore, if a ruleset contains more than one out-rule,
 *   each `out`-ed feature must have its own key in the `trainees` map. You can
 *   select which feature to train from the dropdown menu on FathomFox's Trainer page.
 * - I would not recommend using the Corpus Collector to build up a training set,
 *   because you can only batch freeze original pages, meaning tagged pages would be
 *   re-freezed, and there are non-obvious side effects in the diff (an issue with
 *   the freeze-dried library Fathom uses).
 */

function rulesetMaker(coefficients) {
  // The coefficients are updated over time during training, so create a new factory for
  // each iteration
  const rulesetFactory = new RulesetFactory(coefficients);
  return rulesetFactory.makeRuleset();
}

const trainees = new Map([
  [
    'image',
    {
      coeffs,
      rulesetMaker,
    },
  ],
  [
    'title',
    {
      coeffs,
      rulesetMaker,
    },
  ],
  [
    'price',
    {
      coeffs,
      rulesetMaker,
    },
  ],
]);

export default trainees;
