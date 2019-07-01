/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* eslint-disable import/no-unresolved */
import coefficients from './coefficients.json';
import {biases} from './biases.json';
import RulesetFactory from './ruleset_factory';

/**
 * Rulesets to train using Fathom.
 *
 * More mechanically, a map of names to {coeffs, viewportSize, vectorType, rulesetMaker}
 * objects.
 * rulesetMaker is a function that takes an Array of coefficients and returns a
 * ruleset that uses them. coeffs is typically the best-yet-found coefficients
 * for a ruleset but can also be some more widely flung ones that you want to
 * start the trainer from. The rulesets you specify here show up in FathomFox's
 * UI, from which you can kick off a Vectorizer run (the first step for training).
 *
 * How to train:
 *  1. Fork the `mozilla/fathom-trainees` repo,
 *  2. In the `fathom-trainees` add-on, copy `src/extraction/fathom` to the
 *     `./src` folder; you can ignore subdirectories in this folder.
 *  3. Follow instructions at: https://github.com/mozilla/fathom-fox#vectorizer
 *     and https://github.com/mozilla/fathom-fox#trainer.
 *
 * Notes:
 * - FathomFox assumes that the value of your corpus' `data-fathom` attribute is the
 *   same as the `out`-ed string. Example: An element tagged with `data-fathom='image'`
 *   will map to `rule(..., out('image'))`.
 * - It also assumes that the name of the ruleset and the out-rule of interest
 *   are the same. Therefore, if a ruleset contains more than one out-rule,
 *   each `out`-ed feature must have its own key in the `trainees` map. You can
 *   select which feature to train from the dropdown menu on FathomFox's Vectorizer page.
 */
const trainees = new Map();
const VIEWPORT_SIZE = {width: 1680, height: 950};

const FEATURES = ['image', 'title', 'price'];
for (const feature of FEATURES) {
  const ruleset = {
    coeffs: new Map(coefficients[feature]),
    viewportSize: VIEWPORT_SIZE,
    vectorType: feature,
    rulesetMaker: () => (new RulesetFactory()).makeRuleset([
      ...coefficients.image,
      ...coefficients.title,
      ...coefficients.price,
    ],
    biases),
  };
  trainees.set(feature, ruleset);
}

export default trainees;
