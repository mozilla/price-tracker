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

// URLs to files within the extension
export const FIRST_RUN_URL = browser.extension.getURL('/first_run/index.html');
export const BROWSER_ACTION_URL = browser.extension.getURL('/browser_action/index.html');

// Price alert config
export const ALERT_PERCENT_THRESHOLD = 0.05;
export const ALERT_ABSOLUTE_THRESHOLD = 1000;

/** Color of the toolbar badge for showing active price alerts. */
export const BADGE_ALERT_BACKGROUND = '#00FEFF';

/** Color of the toolbar badge when a product on the current page is trackable. */
export const BADGE_DETECT_BACKGROUND = '#33F70C';

/** URL for the add-on's page on support.mozilla.org */
export const SUPPORT_URL = 'https://support.mozilla.org';
