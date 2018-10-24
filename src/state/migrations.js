/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Redux duck that handles running data migrations. Migrations are functions
 * that transform the state and are used to make changes to the stored data
 * when the add-on updates.
 * @module
 */

import uuidv4 from 'uuid/v4';

import {getOldestPriceForProduct} from 'commerce/state/prices';

/**
 * List of data migrations to run. The order of this list MUST NOT BE MODIFIED!
 * Add new migrations to the end of the list.
 *
 * Migrations receive the Redux state as an argument and must return the
 * migrated state. They must be pure functions in the same way that reducers
 * must be pure functions (do not mutate arguments, perform side effects, or
 * call non-pure functions).
 *
 * The migration number that is used to keep track of which migrations have
 * been run is an index into this list pointing to the next migration to run.
 * For example, if the migration number is 3, then migrations 0, 1, and 2 have
 * already been applied. If all migrations have been run and the state is up to
 * date, the migration number equals the length of this list.
 */
const MIGRATIONS = [
  /**
   * Example migration that does not modify the state at all.
   */
  function initialExample(state) {
    return state;
  },

  function addProductVendorFaviconUrl(state) {
    return {
      ...state,
      products: state.products.map(product => ({
        ...product,
        vendorFaviconUrl: '',
      })),
    };
  },

  function addProductKey(state) {
    return {
      ...state,
      products: state.products.map(product => ({
        ...product,
        anonId: uuidv4(),
      })),
    };
  },

  /**
   * Set high prices for existing alerts as the original price.
   */
  function addHighPriceAmount(state) {
    return {
      ...state,
      priceAlerts: state.priceAlerts.map((alert) => {
        const oldestPrice = getOldestPriceForProduct(state, alert.productId);
        return {
          ...alert,
          highPriceAmount: oldestPrice.amount.getAmount(),
        };
      }),
    };
  },

  function removeVendorFaviconUrl(state) {
    return {
      ...state,
      products: state.products.map((product) => {
        const {vendorFaviconUrl, ...newProduct} = product;
        return newProduct;
      }),
    };
  },
];

// Actions

export const CHECK_MIGRATIONS = 'commerce/migrations/CHECK_MIGRATIONS';

// Reducer

export default function reducer(state, action = {}) {
  switch (action.type) {
    case CHECK_MIGRATIONS: {
      const migrationsToRun = MIGRATIONS.slice(getMigrationNumber(state));
      const migratedState = migrationsToRun.reduce(
        (intermediateState, migration) => migration(intermediateState),
        state,
      );

      return {
        ...migratedState,
        migrationNumber: MIGRATIONS.length,
      };
    }
    default: {
      return state;
    }
  }
}

// Action Creators

/**
 * Check for any unapplied migrations and apply them to the state.
 */
export function checkMigrations() {
  return {type: CHECK_MIGRATIONS};
}

// Selectors

/**
 * Fetch the current migration number. Defaults to 0 if none is set.
 * @param {ReduxState} state
 * @return {number}
 */
export function getMigrationNumber(state) {
  return state.migrationNumber || 0;
}
