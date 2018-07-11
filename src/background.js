/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

browser.browserAction.onClicked.addListener(() => {
  browser.sidebarAction.open();
});

browser.runtime.onMessage.addListener((message) => {
  if (message.type === 'product-data') {
    // TODO: Send this data to the sidebar to be displayed
    console.log(message.data);
  }
});
