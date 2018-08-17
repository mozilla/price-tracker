/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Config values that are shared between files or otherwise useful to have in
 * a separate file.
 * @module
 */

/** Time to wait between price checks for a product */
export const PRICE_CHECK_INTERVAL = 1000 * 60 * 60 * 6; // 6 hours

/** Time to wait between checking if we should fetch new prices */
export const PRICE_CHECK_TIMEOUT_INTERVAL = 1000 * 60 * 15; // 15 minutes

/** Delay before removing iframes created during price checks */
export const IFRAME_TIMEOUT = 1000 * 60; // 1 minute

// Minimum score to be considered the "correct" feature element extracted by Fathom
export const SCORE_THRESHOLD = 4;
