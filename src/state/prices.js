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
import orderBy from 'lodash.orderby';
import pt from 'prop-types';

import config from 'commerce/config';
import {
  ADD_PRODUCT,
  getProduct,
  getProductIdFromExtracted,
  REMOVE_MARKED_PRODUCTS,
} from 'commerce/state/products';

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

  /** The "high price" at the time this alert triggered */
  highPriceAmount: pt.number.isRequired,
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
const DEACTIVATE_ALL_PRICE_ALERTS = 'commerce/prices/DEACTIVATE_ALL_PRICE_ALERTS';
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

    // Delete related prices when deleting products.
    case REMOVE_MARKED_PRODUCTS: {
      return {
        ...state,
        prices: state.prices.filter((price) => {
          const product = getProduct(state, price.productId);
          return product && !product.isDeleted;
        }),
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

    case DEACTIVATE_ALL_PRICE_ALERTS: {
      return {
        ...state,
        priceAlerts: state.priceAlerts.map(
          alert => ({...alert, active: false}),
        ),
      };
    }

    default: {
      return state;
    }
  }
}

// Action Creators

/**
 * Adds a new price to the store. Returns true if the extracted price
 * is different than the last known price in state.
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

      // Potentially trigger an alert since there's a new price in town.
      dispatch(triggerPriceAlert(price));

      return price;
    }
    return null;
  };
}

/**
 * Trigger a price alert if the given new price has dropped enough.
 * @param {Price} price The new price being added
 */
export function triggerPriceAlert(price) {
  return async (dispatch, getState) => {
    const state = getState();
    const productId = price.productId;

    // Prices with an active alert should not trigger a new one.
    if (getActivePriceAlertForProduct(state, productId)) {
      return;
    }

    // The first price should never trigger an alert.
    const prices = getPricesForProduct(state, productId);
    if (prices.length < 1) {
      return;
    }

    // If the difference between the high price and new price is below both alert
    // thresholds, do not trigger an alert.
    const highPrice = getHighPrice(state, prices, productId);
    const newPrice = new PriceWrapper(price);

    const difference = highPrice.amount.subtract(newPrice.amount);
    const belowAbsoluteThreshold = (
      difference.getAmount() < await config.get('alertAbsoluteThreshold')
    );
    const percentDifference = difference.getAmount() / highPrice.amount.getAmount();
    const belowPercentThreshold = (
      percentDifference < await config.get('alertPercentThreshold')
    );

    if (belowPercentThreshold && belowAbsoluteThreshold) {
      return;
    }

    dispatch({
      type: ADD_PRICE_ALERT,
      alert: {
        productId: price.productId,
        priceId: price.id,
        highPriceAmount: highPrice.amount.getAmount(),
        date: price.date,
      },
    });
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

export function deactivateAllAlerts() {
  return {type: DEACTIVATE_ALL_PRICE_ALERTS};
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

/**
 * Sort a given list of products by the oldest logged price, most-recent first.
 * @param {ReduxState} state
 * @param {Product[]} products
 * @return {Product[]}
 */
export function getSortedProductsByOldestPrice(state, products) {
  return orderBy(products, [
    product => getOldestPriceForProduct(state, product.id).date,
  ], ['desc']);
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
 * Find the previous "high price".
 * A high price is, semantically, the price that there's been an interesting
 * drop from to warrant alerting the user. Practically, it is the highest
 * price since the previous price alert.
 * @param {ReduxState} state
 * @param {PriceWrapper[]} prices
 * @param {string} productId
 * @return {PriceWrapper}
 */
function getHighPrice(state, prices, productId) {
  let pricesSinceLastAlert = prices;

  // Filter the prices we're searching to only those since the previous alert.
  const previousPriceAlert = getLatestPriceAlertForProduct(state, productId);
  if (previousPriceAlert) {
    // The alert's price might be the high price, so we use >= to compare.
    const alertDate = new Date(previousPriceAlert.date);
    pricesSinceLastAlert = pricesSinceLastAlert.filter(p => p.date >= alertDate);
  }
  return maxBy(pricesSinceLastAlert, p => p.amount.getAmount());
}
