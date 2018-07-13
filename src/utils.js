/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const utils = {
  /* Turns setTimeout, a callback-based method, into a promise-based method,
  * so that it can be awaited in the 'retry' method. */
  async wait(delay) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, delay);
    });
  },

  /* Attempts a promise-based callback a fixed number of times, with increasing
  * delays between attempts. Throws an error if the final attempt fails. */
  async retry(callback, maxRetries = 5, delayFactor = 2, initialDelay = 2) {
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
