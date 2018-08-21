/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Redux duck that handles syncing the state tree to extension storage so that
 * it persists between JS contexts and restarts.
 * @module
 */

// Actions

export const LOAD_FROM_STORAGE = 'commerce/sync/LOAD_FROM_STORAGE';

// Reducer

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

// Action Creators

/**
 * Load persisted state from extension storage, and replace the entire state
 * with it.
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

// Helpers

/**
 * Save the given state to extension storage, and notify the rest of the add-on
 * that the newly saved state needs to be loaded.
 * @param {ReduxState} state
 */
export async function saveStateToStorage(state) {
  const serializedState = JSON.stringify(state);
  await browser.storage.local.set({commerce: serializedState});

  // needsSync is always true, unless the last action to be processed was
  // LOAD_FROM_STORAGE. This avoids a loop between two contexts that keep
  // sending update messages in response to loading new state from eachother.
  if (state.needsSync) {
    try {
      await browser.runtime.sendMessage({type: 'store-update'});
    } catch (err) {
      // Ignore the case where there are no other listeners, such as when the
      // background script is the only active context.
      if (!err.message.includes('Receiving end does not exist.')) {
        throw err;
      }
    }
  }
}
