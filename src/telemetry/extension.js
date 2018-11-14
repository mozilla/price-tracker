/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Registers and records telemetry events throughout the extension.
 * @module
 */

import {shouldCollectTelemetry} from 'commerce/privacy';
import store from 'commerce/state';
import {getAllProducts} from 'commerce/state/products';
import {CATEGORY, EVENTS} from 'commerce/telemetry/events';

export async function registerEvents() {
  await browser.telemetry.registerEvents(CATEGORY, EVENTS);
}

export async function recordEvent(method, object, value, extraBase = {}) {
  if (!browser.telemetry.canUpload() || !(await shouldCollectTelemetry(method))) {
    return;
  }

  // Append extra keys that are sent with all events
  const extra = {
    ...extraBase,
    tracked_prods: getAllProducts(store.getState()).length,
    privacy_dnt: navigator.doNotTrack === '1',
    privacy_tp: (await browser.privacy.websites.trackingProtectionMode.get({})).value,
    privacy_cookie: (await browser.privacy.websites.cookieConfig.get({})).value.behavior,
  };

  // Convert all extra key values to strings as required by event telemetry
  for (const [extraKey, extraValue] of Object.entries(extra)) {
    extra[extraKey] = extraValue.toString();
  }

  await browser.telemetry.recordEvent(
    CATEGORY,
    method,
    object,
    value,
    extra,
  );
}

// Get the tabId for the currently focused tab in the currently focused window.
async function getActiveTabId() {
  const windowId = (await browser.windows.getCurrent()).id;
  return (
    (await browser.tabs.query({
      windowId,
      active: true,
    }))[0].id
  );
}

export async function getBadgeType() {
  // browserAction and background scripts have to use activeTabId as a proxy for the tabId
  const badgeText = await getToolbarBadgeText(await getActiveTabId());
  switch (true) {
    case (badgeText === ''):
      return 'none';
    case (badgeText === '✚'):
      return 'add';
    case (/\d+/.test(badgeText)):
      return 'price_alert';
    default:
      console.warn(`Unexpected badge text ${badgeText}.`); // eslint-disable-line no-console
      return 'unknown';
  }
}

export async function getToolbarBadgeText(tabId = null) {
  // The 'add' badge modifies badge text for a specific tab and will have a tabId.
  // The 'price_alert' badge modifies the global badge text and will not have a tabId.
  return browser.browserAction.getBadgeText(
    tabId ? {tabId} : {},
  );
}

export async function handleWidgetRemoved(widgetId) {
  const addonId = (await browser.management.getSelf()).id;
  // widgetId replaces '@' and '.' in the addonId with _
  const modifiedAddonId = addonId.replace(/[@.+]/g, '_');
  if (`${modifiedAddonId}-browser-action` === widgetId) {
    await recordEvent('hide_toolbar_button', 'toolbar_button', null, {
      badge_type: await getBadgeType(),
    });
  }
}

/**
 * Log telemetry events sent from content scripts.
 * @param {object} message
 */
export async function handleTelemetryMessage(message) {
  return recordEvent(
    message.method,
    message.object,
    message.value,
    message.extra,
  );
}
