/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Centralized message handler for the background script.
 *
 * If you return a promise from the handler for browser.runtime.onMessage,
 * the browser will assume you're sending a message back to the sender and will
 * return whatever that Promise resolves to. A side effect is that multiple
 * async handlers will fail because the first one to run will set the final
 * return value, even if it resolves to `undefined`.
 *
 * A centralized message handler avoids this by checking all potential messages
 * in a single handler.
 * @module
 */

import {handleConfigMessage} from 'commerce/config/background';
import {handleExtractedProductData} from 'commerce/background/extraction';

export const handlers = new Map([
  ['extracted-product', handleExtractedProductData],
  ['config', handleConfigMessage],
]);

export default async function handleMessage(message, sender) {
  if (handlers.has(message.type)) {
    return handlers.get(message.type)(message, sender);
  }

  return undefined;
}
