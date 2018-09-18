/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import checkPropTypes from 'check-prop-types';

/**
 * Resolves when the amount of time specified by delay has elapsed.
 */
export async function wait(delay) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delay);
  });
}

/**
 * Calls the given callback, retrying if it rejects or throws an error.
 * The delay between attempts increases per-try.
 *
 * @param {function} callback Function to call
 * @param {number} maxRetries Number of times to try calling
 * @param {number} delayFactor Multiplier for delay increase per-try
 * @param {number} initialDelay Initial delay in milliseconds
 */
export async function retry(callback, maxRetries = 5, delayFactor = 2, initialDelay = 1000) {
  /* eslint-disable no-await-in-loop */
  let delay = initialDelay;
  let lastError = null;
  for (let k = 0; k < maxRetries; k++) {
    try {
      // If we don't await here, the callback's promise will be returned
      // immediately instead of potentially failing.
      return await callback();
    } catch (err) {
      lastError = err;
      await wait(delay);
      delay *= delayFactor;
    }
  }
  throw lastError;
}

/**
 * Wrapper for check-prop-types to check a propType against a single value.
 * @param {*} value Value to validate
 * @param {PropType} propType The Proptype to validate value against
 * @return {string|undefined}
 *  Undefined if the validation was successful, or an error string explaining
 *  why it failed.
 */
export function validatePropType(value, propType) {
  return checkPropTypes({value: propType}, {value}, 'prop', 'Validation');
}
