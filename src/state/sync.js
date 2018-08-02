/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Redux duck that handles syncing the state tree to extension storage so that
 * it persists between JS contexts and restarts.
 */

export const LOAD_FROM_STORAGE = 'commerce/sync/LOAD_FROM_STORAGE';

/**
 * Replace the entire state tree with the loaded state. This reducer must not be
 * run via combineReducers, as it needs to replace the _entire_ state tree;
 * combineReducers would limit it to a "sync" namespace.
 */
export default function reducer(state, action = {}) {
  switch (action.type) {
    case LOAD_FROM_STORAGE:
      return {
        ...action.state,
        needsSync: false,
      };
    default:
      return {
        ...state,
        needsSync: true,
      };
  }
}

/**
 * Save state to extension storage, and notify the rest of the add-on that
 * things have changed.
 */
export async function saveStateToStorage(state) {
  const serializedState = JSON.stringify(state);
  await browser.storage.local.set({commerce: serializedState});

  if (state.needsSync) {
    try {
      await browser.runtime.sendMessage({type: 'store-update'});
    } catch (err) {
      if (!err.message.includes('Receiving end does not exist.')) {
        throw err;
      }
    }
  }
}

/**
 * Action creator that loads persisted state from extension storage, and tells
 * the store to replace the existing state with it.
 */
export function loadStateFromStorage() {
  return async (dispatch) => {
    const results = await browser.storage.local.get({commerce: null});
    const serializedData = results.commerce;
    if (serializedData) {
      dispatch({
        type: LOAD_FROM_STORAGE,
        state: JSON.parse(serializedData),
      });
    }
  };
}
