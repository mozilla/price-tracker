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
  if (await trackingProtectionEnabled()) {
    return false;
  }

  if (doNotTrackEnabled()) {
    return false;
  }

  if (await cookiesBlocked()) {
    return false;
  }

  return true;
}

/**
 * Determine if a background price update should start
 * @return {boolean}
 */
export async function shouldUpdatePrices() {
  if (await trackingProtectionEnabled()) {
    return false;
  }

  if (doNotTrackEnabled()) {
    return false;
  }

  if (await cookiesBlocked()) {
    return false;
  }

  return true;
}

async function trackingProtectionEnabled() {
  const result = await browser.privacy.websites.trackingProtectionMode.get({});
  return result.value === 'always';
}

function doNotTrackEnabled() {
  return navigator.doNotTrack === '1';
}

async function cookiesBlocked() {
  if (browser.privacy.websites.cookieConfig) {
    const {behavior} = (await browser.privacy.websites.cookieConfig.get({})).value;
    if (!['allow_all', 'allow_visited', 'reject_trackers'].includes(behavior)) {
      return true;
    }

    return false;
  }

  return true;
}
