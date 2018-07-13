/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const utils = {
  /**
   * Resolves when the amount of time specified by delay has elapsed.
   */
  async wait(delay) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, delay);
    });
  },

  /**
   * Calls the given callback, retrying if it rejects or throws an error.
   * The delay between attempts increases per-try.
   *
   * @param {function} callback Function to call
   * @param {number} maxRetries Number of times to try calling
   * @param {number} delayFactor Multiplier for delay increase per-try
   * @param {number} initialDelay Initial delay in milliseconds
   */
  async retry(callback, maxRetries = 5, delayFactor = 2, initialDelay = 1000) {
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
        await utils.wait(delay);
        delay *= delayFactor;
      }
    }
    throw lastError;
  },
};

export default utils;
