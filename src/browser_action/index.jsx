/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';

import BrowserActionApp from 'commerce/browser_action/components/BrowserActionApp';
import store from 'commerce/state';

import 'commerce/styles/colors.css';
import 'commerce/browser_action/index.css';

// Pull info about the currently-viewed product if its present.
const appProps = {};
const url = new URL(window.location.href);
const extractedProductJSON = url.searchParams.get('extractedProduct');
if (extractedProductJSON) {
  appProps.extractedProduct = JSON.parse(extractedProductJSON);
}

(async function checkOverflow() {
  if (await browser.customizableUI.isWidgetInOverflow('shopping-testpilot_mozilla_org-browser-action')) {
    document.getElementById('browser-action-app').classList.add('overflow');
  }
}());

ReactDOM.render(
  <Provider store={store}>
    <BrowserActionApp {...appProps} />
  </Provider>,
  document.getElementById('browser-action-app'),
);

// Notify the background script that the browser action has been opened. This
// must be done using connect so that the background script can detect when the
// panel closes.
const port = browser.runtime.connect();
port.postMessage({type: 'browser-action-opened'});
