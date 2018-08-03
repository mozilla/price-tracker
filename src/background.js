/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

browser.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((message) => {
    if (message.from === 'content' && message.subject === 'ready') {
      console.log(message.extractedProduct); // eslint-disable-line no-console
    }
  });
  port.postMessage({
    type: 'background-ready',
  });
});
