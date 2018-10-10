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

// Pull tabId if present; only available via the url when there's a currently-viewed product
const tabIdJSON = url.searchParams.get('tabId');
if (tabIdJSON) {
  appProps.tabId = JSON.parse(tabIdJSON);
}

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
