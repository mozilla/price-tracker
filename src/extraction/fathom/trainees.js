import {ruleset, rule, dom, type, score, out} from 'fathom-web';
import {ancestors} from 'fathom-web/utilsForFrontend';

import RulesetFactory from './ruleset_factory';


/**
 * Rulesets to train.
 *
 * More mechanically, a map of names to {coeffs, rulesetMaker} objects.
 * rulesetMaker is a function that takes an Array of coefficients and returns a
 * ruleset that uses them. coeffs is typically the best-yet-found coefficients
 * for a ruleset but can also be some more widely flung ones that you want to
 * start the trainer from. The rulesets you specify here show up in the Train
 * UI, from which you can kick off a training run.
 */
const trainees = new Map();

const commonRuleset = {
    coeffs: [7, 1, 18, 19, 2, 20, 4, 7, 6, 2],
    viewportSize: {width: 1680, height: 950},
    rulesetMaker: coeffs => (new RulesetFactory(coeffs)).makeRuleset()
};

trainees.set('image', commonRuleset);
trainees.set('title', commonRuleset);
trainees.set('price', commonRuleset);

export default trainees;
