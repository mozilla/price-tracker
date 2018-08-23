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

import {ADD_PRODUCT, getProductIdFromExtracted} from 'commerce/state/products';
import {priceStringToAmount} from 'commerce/utils';

// Types

/**
 * @typedef Price
 * @type {object}
 */
export const priceShape = pt.shape({
  productId: pt.string.isRequired,
  amount: pt.object.isRequired,
  date: pt.instanceOf(Date).isRequired,
});

/**
 * Wrapper for price data from the state. Instances of this class are what is
 * returned by the selectors.
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
}

// Actions

const ADD_PRICE = 'commerce/prices/ADD_PRICE';

// Reducer

function initialState() {
  return {
    prices: [],
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
      const newPrice = priceFromExtracted(action.extractedProductData);

      let prices = state.prices;
      if (shouldAddNewPrice(state, newPrice)) {
        prices = state.prices.concat([newPrice]);
      }

      return {
        ...state,
        prices,
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
  return {
    type: ADD_PRICE,
    extractedProductData: data,
  };
}

// Selectors

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
 * @param {[type]} productId Unique ID of the product to fetch prices for
 * @return {PriceWrapper}
 */
export function getOldestPriceForProduct(state, productId) {
  const prices = getPricesForProduct(state, productId);
  return minBy(prices, price => price.date);
}

// Helpers

/**
 * Create a price entry from extracted product data.
 * @param {ExtractedProduct} data
 * @return {Price}
 */
export function priceFromExtracted(data) {
  return {
    productId: getProductIdFromExtracted(data),
    amount: priceStringToAmount(data.price),
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
