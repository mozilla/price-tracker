/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';

import BrowserActionApp from 'commerce/browser_action/components/BrowserActionApp';
import store from 'commerce/state';

import 'commerce/browser_action/index.css';

// Pull info about the currently-viewed product if its present.
const appProps = {};
const url = new URL(window.location.href);
const extractedProductJSON = url.searchParams.get('extractedProduct');
if (extractedProductJSON) {
  appProps.extractedProduct = JSON.parse(extractedProductJSON);
}
render();

browser.runtime.onMessage.addListener((message) => {
  if (message.from === 'background' && message.subject === 'extracted-product') {
    appProps.extractedProduct = message.data;
    render();
  }
});

function render() {
  ReactDOM.render(
    <Provider store={store}>
      <BrowserActionApp {...appProps} />
    </Provider>,
    document.getElementById('browser-action-app'),
  );
}
