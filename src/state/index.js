/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Global redux-based state store for the entire extension. The store is
 * automatically synced between JS contexts (background, browser action, etc).
 *
 * This module has side-effects on import to register listeners for persisting
 * and loading state.
 */

import {applyMiddleware, combineReducers, createStore} from 'redux';
import thunk from 'redux-thunk';

import prices from 'commerce/state/prices';
import products from 'commerce/state/products';
import sync, {loadStateFromStorage, saveStateToStorage} from 'commerce/state/sync';

const appReducer = combineReducers({
  prices,
  products,
});

/**
 * Applies the sync reducer without namespacing from combineReducers so that it
 * can replace the entire state object from storage.
 */
function rootReducer(state, action = {}) {
  const syncedState = sync(state, action);
  return appReducer(syncedState, action);
}

const store = createStore(
  rootReducer,
  applyMiddleware(thunk),
);

// Persist state changes to extension storage.
store.subscribe(async () => {
  saveStateToStorage(store.getState());
});

// Listen for state changes in other contexts and update when they happen.
browser.runtime.onMessage.addListener((message) => {
  if (message.type === 'store-update') {
    store.dispatch(loadStateFromStorage());
  }
});

export default store;
