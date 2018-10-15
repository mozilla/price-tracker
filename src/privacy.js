/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Handles checking privacy settings to gate functionality across the add-on.
 * @module
 */

/**
 * Determine if a content script should extract a product.
 * @return {boolean}
 */
export async function shouldExtract() {
  return !browser.extension.inIncognitoContext;
}

/**
 * Determine if a telemetry event should be recorded
 * @return {boolean}
 */
export async function shouldCollectTelemetry() {
  // Privacy controls disable telemetry
  if (await arePrivacyControlsActive()) {
    return false;
  }

  // Content scripts in private browsing windows don't collect telemetry.
  if (browser.extension.inIncognitoContext) {
    return false;
  }

  return true;
}

/**
 * Determine if a background price update should start
 * @return {boolean}
 */
export async function shouldUpdatePrices() {
  // Privacy controls disable price updates
  if (await arePrivacyControlsActive()) {
    return false;
  }

  return true;
}

/**
 * Helper for checking privacy flags that are used in multiple feature flags.
 */
async function arePrivacyControlsActive() {
  // Tracking  Protection
  if ((await browser.privacy.websites.trackingProtectionMode.get({})).value === 'always') {
    return true;
  }

  // Do Not Track
  if (navigator.doNotTrack === '1') {
    return true;
  }

  // Cookie blocking
  if (browser.privacy.websites.cookieConfig) {
    const {behavior} = (await browser.privacy.websites.cookieConfig.get({})).value;
    if (!['allow_all', 'allow_visited'].includes(behavior)) {
      return true;
    }
  }

  return false;
}
