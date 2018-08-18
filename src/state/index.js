/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Global redux-based state store for the entire extension. The store is
 * automatically synced between JS contexts (background, browser action, etc).
 *
 * This module has side-effects on import to register listeners for persisting
 * and loading state.
 * @module
 */

import {applyMiddleware, createStore} from 'redux';
import thunk from 'redux-thunk';

import prices from 'commerce/state/prices';
import products from 'commerce/state/products';
import sync, {loadStateFromStorage, saveStateToStorage} from 'commerce/state/sync';

/**
 * Type definition for the global Redux state object.
 * @typedef ReduxState
 * @type {object}
 */

const REDUCERS = [sync, prices, products];

/**
 * Build the initial app state in a similar way to combineReducers by calling
 * each reducer with an undefined state.
 * @return {ReduxState} Initial state for the app
 */
function initialState() {
  const initialStates = REDUCERS.map(
    reducer => reducer(undefined, {type: '@@INIT'}),
  );
  return Object.assign({}, ...initialStates);
}

/**
 * Base reducer for the entire app.
 *
 * We avoid Redux's combineReducers here so that reducers aren't namespaced and
 * can access the entire app state.
 */
function rootReducer(state = initialState(), action = {}) {
  // Runs each reducer against the state/action in sequence from top to bottom.
  // The modified state returned by each reducer is passed to the next one in
  // sequence.
  return [
    sync,
    prices,
    products,
  ].reduce(
    (reducedState, reducer) => reducer(reducedState, action),
    state,
  );
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
