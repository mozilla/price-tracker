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
import {handleBrowserActionOpened} from 'commerce/background/browser_action';
import {handleExtractedProductData} from 'commerce/background/extraction';
import {recordEvent} from 'commerce/background/telemetry';

// if (message.from === 'browser_action_popup' && message.data.method) {
//   recordEvent(message.data.method, message.data.object, message.data.value, message.data.extra);
// }

// sendMessage/onMessage handlers

export const messageHandlers = new Map([
  ['extracted-product', handleExtractedProductData],
  ['config', handleConfigMessage],
  ['browser_action_popup', (message) => {
    recordEvent(
      message.data.method,
      message.data.object,
      message.data.value,
      message.data.extra,
    );
  }],
]);

export async function handleMessage(message, sender) {
  if (messageHandlers.has(message.type)) {
    return messageHandlers.get(message.type)(message, sender);
  }

  return undefined;
}

// connect/port handlers

export const portMessageHandlers = new Map([
  ['browser-action-opened', handleBrowserActionOpened],
]);

export function handleConnect(port) {
  port.onMessage.addListener((portMessage) => {
    if (portMessageHandlers.has(portMessage.type)) {
      return portMessageHandlers.get(portMessage.type)(portMessage, port);
    }

    return undefined;
  });
}
