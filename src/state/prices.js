/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Redux duck for product prices extracted from a product webpage.
 * @module
 */

import Dinero from 'dinero.js';
import maxBy from 'lodash.maxby';
import minBy from 'lodash.minby';
import pt from 'prop-types';

import config from 'commerce/config';
import {ADD_PRODUCT, getProductIdFromExtracted} from 'commerce/state/products';

// Types

/**
 * Proptype definition for PriceWrapper objects.
 */
export const priceWrapperShape = pt.shape({
  productId: pt.string.isRequired,
  amount: pt.object.isRequired,
  date: pt.instanceOf(Date).isRequired,
});

/**
 * A price as it is stored within the Redux store. Must be JSON serializable to
 * be saved to extension storage.
 * @typedef Price
 * @type {object}
 */
export const priceShape = pt.shape({
  id: pt.string.isRequired,
  productId: pt.string.isRequired,
  amount: pt.number.isRequired,
  date: pt.string.isRequired,
});

/**
 * @typedef PriceAlert
 * @type {object}
 */
export const priceAlertShape = pt.shape({
  /** Price to PriceAlert is a 1:1 relationship; priceId is unique per-alert */
  priceId: pt.string.isRequired,

  productId: pt.string.isRequired,
  date: pt.string.isRequired,

  /**
   * Active is true if the user hasn't cleared the alert by interacting with it.
   * Only one alert should be active per-product at a time.
   */
  active: pt.bool.isRequired,

  /** Shown is true if the notification for the alert has been displayed */
  shown: pt.bool.isRequired,
});

/**
 * A price as it is returned by the selectors. PriceWrapper converts fields that
 * are JSON-serializable to more useful types for the app, e.g. converting date
 * strings into Date instances so we can compare them.
 */
class PriceWrapper {
  constructor(price) {
    this.productId = price.productId;
    this.amount = Dinero({amount: price.amount});
    this.date = new Date(price.date);
  }

  equals(price) {
    return this.amount.equalsTo(price.amount);
  }

  /**
   * Calculate the percent difference between this price and another.
   * A positive result indicates that the new price is higher than this
   * one, and vice versa.
   * @param {Price} price
   * @return {number}
   *  The difference in percentage points from this price to the given one.
   */
  percentDifference(price) {
    const difference = price.amount.subtract(this.amount);
    return Math.round((difference.getAmount() / this.amount.getAmount()) * 100);
  }
}

// Actions

const ADD_PRICE = 'commerce/prices/ADD_PRICE';
const ADD_PRICE_ALERT = 'commerce/prices/ADD_PRICE_ALERT';
const DEACTIVATE_PRICE_ALERT = 'commerce/prices/DEACTIVATE_PRICE_ALERT';
const SHOW_PRICE_ALERT = 'commerce/prices/SHOW_PRICE_ALERT';

// Reducer

function initialState() {
  return {
    prices: [],
    priceAlerts: [],
  };
}

export default function reducer(state = initialState(), action) {
  switch (action.type) {
    case ADD_PRODUCT: {
      const newPrice = priceFromExtracted(action.extractedProductData);
      return {
        ...state,
        prices: state.prices.concat([newPrice]),
      };
    }

    case ADD_PRICE: {
      return {
        ...state,
        prices: state.prices.concat([action.price]),
      };
    }

    case ADD_PRICE_ALERT: {
      // New alerts are active by default.
      const newAlert = {
        ...action.alert,
        active: true,
        shown: false,
      };

      // Mark any previous active alerts for the product as inactive.
      const priceAlerts = state.priceAlerts.map((alert) => {
        if (alert.productId === newAlert.productId && alert.active) {
          return {...alert, active: false};
        }

        return alert;
      });

      return {
        ...state,
        priceAlerts: priceAlerts.concat([newAlert]),
      };
    }

    case SHOW_PRICE_ALERT: {
      return {
        ...state,
        priceAlerts: state.priceAlerts.map((alert) => {
          if (alert.priceId === action.priceId) {
            return {...alert, shown: true};
          }

          return alert;
        }),
      };
    }

    case DEACTIVATE_PRICE_ALERT: {
      return {
        ...state,
        priceAlerts: state.priceAlerts.map((alert) => {
          if (alert.priceId === action.priceId) {
            return {...alert, active: false};
          }

          return alert;
        }),
      };
    }

    default: {
      return state;
    }
  }
}

// Action Creators

/**
 * Adds a new price to the store.
 * @param {ExtractedProduct} data
 */
export function addPriceFromExtracted(data) {
  return async (dispatch, getState) => {
    const price = priceFromExtracted(data);
    const state = getState();

    if (shouldAddNewPrice(state, price)) {
      dispatch({
        type: ADD_PRICE,
        price,
      });

      // Check if we need to alert since there's a new price in town.
      if (await shouldTriggerPriceAlert(state, price)) {
        dispatch({
          type: ADD_PRICE_ALERT,
          alert: {
            productId: price.productId,
            priceId: price.id,
            date: price.date,
          },
        });
      }
    }
  };
}

export function showPriceAlert(alert) {
  return {
    type: SHOW_PRICE_ALERT,
    priceId: alert.priceId,
  };
}

export function deactivateAlert(alert) {
  return {
    type: DEACTIVATE_PRICE_ALERT,
    priceId: alert.priceId,
  };
}

// Selectors

/**
 * Get a specific price
 * @param {ReduxState} state
 * @param {string} priceId
 * @return {PriceWrapper|null}
 */
export function getPrice(state, priceId) {
  const price = state.prices.find(p => p.id === priceId);
  if (price) {
    return new PriceWrapper(price);
  }

  return null;
}

/**
 * Fetch every stored price for a product.
 * @param {ReduxState} state
 * @param {string} productId Unique ID of the product to fetch prices for.
 * @return {PriceWrapper[]}
 */
export function getPricesForProduct(state, productId) {
  const prices = state.prices.filter(
    price => price.productId === productId,
  );
  return prices.map(price => new PriceWrapper(price));
}

/**
 * Fetch the most recently-fetched price for a product.
 * @param {ReduxState} state
 * @param {[type]} productId Unique ID of the product to fetch prices for
 * @return {PriceWrapper}
 */
export function getLatestPriceForProduct(state, productId) {
  const prices = getPricesForProduct(state, productId);
  return maxBy(prices, price => price.date);
}

/**
 * Fetch the oldest price for a product.
 * @param {ReduxState} state
 * @param {string} productId Unique ID of the product to fetch prices for
 * @return {PriceWrapper}
 */
export function getOldestPriceForProduct(state, productId) {
  const prices = getPricesForProduct(state, productId);
  return minBy(prices, price => price.date);
}

/**
 * Fetch all price alerts for a single product.
 * @param {ReduxState} state
 * @param {string} productId
 * @return {PriceAlert}
 */
export function getPriceAlertsForProduct(state, productId) {
  return state.priceAlerts.filter(alert => alert.productId === productId);
}

/**
 * Fetch the active price alert for a product, or undefined if none exists.
 * @param {ReduxState} state
 * @param {string} productId
 * @return {PriceAlert|undefined}
 */
export function getActivePriceAlertForProduct(state, productId) {
  const alerts = getPriceAlertsForProduct(state, productId);
  return alerts.find(alert => alert.active);
}

/**
 * Get the most recent price alert for a product, or undefined if there are none.
 * @param {ReduxState} state
 * @param {string} productId
 * @return {PriceAlert|undefined}
 */
export function getLatestPriceAlertForProduct(state, productId) {
  const alerts = getPriceAlertsForProduct(state, productId);
  return maxBy(alerts, alert => alert.date);
}

/**
 * Get all active price alerts.
 * @param {ReduxState} state
 * @return {PriceAlert[]}
 */
export function getActivePriceAlerts(state) {
  return state.priceAlerts.filter(alert => alert.active);
}

/**
 * Get the price alert for a price, if it exists.
 * @param {ReduxState} state
 * @param {string} priceId
 * @return {PriceAlert|undefined}
 */
export function getPriceAlertForPrice(state, priceId) {
  return state.priceAlerts.find(alert => alert.priceId === priceId);
}

// Helpers

/**
 * Create a price entry from extracted product data.
 * @param {ExtractedProduct} data
 * @return {Price}
 */
export function priceFromExtracted(data) {
  const productId = getProductIdFromExtracted(data);
  return {
    id: `${productId}_${data.date}`,
    productId,
    amount: data.price,
    date: data.date,
  };
}

/**
 * Create a PriceWrapper from extracted product data.
 * @param {ExtractedProduct} data
 * @return {PriceWrapper}
 */
export function priceWrapperFromExtracted(data) {
  return new PriceWrapper(priceFromExtracted(data));
}

/**
 * Determine if the given price should be added to the stored price history.
 * @param {ReduxState} state
 * @param {Price} price
 * @return {boolean} True if the price should be stored, False otherwise.
 */
function shouldAddNewPrice(state, price) {
  const newPrice = new PriceWrapper(price);
  const latestPrice = getLatestPriceForProduct(state, price.productId);

  // Skip if the price hasn't changed.
  return !latestPrice.equals(newPrice);
}

/**
 * Determine whether to trigger a price alert due to the given new price being
 * detected.
 * @param {ReduxState} state
 * @param {Price} price The new price being added
 * @return {boolean} True if we should trigger an alert, false otherwise.
 */
async function shouldTriggerPriceAlert(state, price) {
  const productId = price.productId;

  // Prices with an active alert should not trigger a new one.
  if (getActivePriceAlertForProduct(state, productId)) {
    return false;
  }

  // The first price should never trigger an alert.
  let prices = getPricesForProduct(state, productId);
  if (prices.length < 1) {
    return false;
  }

  // Find the previous "high price".
  // A high price is, semantically, the price that there's been an interesting
  // drop from to warrant alerting the user. Practically, it is the highest
  // price since the previous price alert.

  // Filter the prices we're searching to only those since the previous alert.
  const previousPriceAlert = getLatestPriceAlertForProduct(state, productId);
  if (previousPriceAlert) {
    // The alert's price might be the high price, so we use >= to compare.
    const alertDate = new Date(previousPriceAlert.date);
    prices = prices.filter(p => p.date >= alertDate);
  }
  const highPrice = maxBy(prices, p => p.amount.getAmount());

  // If the difference between the high price and new price exceeds alert
  // thresholds, trigger an alert.
  const newPrice = new PriceWrapper(price);
  const difference = highPrice.amount.subtract(newPrice.amount);
  if (difference.getAmount() >= await config.get('alertAbsoluteThreshold')) {
    return true;
  }

  const percentDifference = difference.getAmount() / highPrice.amount.getAmount();
  if (percentDifference >= await config.get('alertPercentThreshold')) {
    return true;
  }

  return false;
}
