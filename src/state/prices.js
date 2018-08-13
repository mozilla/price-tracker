/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Redux duck for product prices extracted from a product webpage.
 */

import Dinero from 'dinero.js';
import pt from 'prop-types';

import {ADD_PRODUCT, getProductIdFromExtracted} from 'commerce/state/products';
import {
  findMax,
  priceStringToAmount,
} from 'commerce/utils';

const ADD_PRICE = 'commerce/prices/ADD_PRICE';

/**
 * Model for the price of a product at a specific point in time.
 */
export class Price {
  constructor(priceEntry) {
    this.productId = priceEntry.productId;
    this.amount = Dinero({amount: priceEntry.amount});
    this.date = new Date(priceEntry.date);
  }

  equals(price) {
    return this.amount.equalsTo(price.amount);
  }
}

export const priceShape = pt.shape({
  productId: pt.string.isRequired,
  amount: pt.object.isRequired,
  date: pt.instanceOf(Date).isRequired,
});

function initialState() {
  return {
    priceEntries: [],
  };
}

export default function reducer(state = initialState(), action) {
  switch (action.type) {
    case ADD_PRODUCT: {
      const newPriceEntry = priceEntryFromExtracted(action.extractedProductData);
      return {
        ...state,
        priceEntries: state.priceEntries.concat([newPriceEntry]),
      };
    }
    case ADD_PRICE: {
      const newPriceEntry = priceEntryFromExtracted(action.extractedProductData);

      let priceEntries = state.priceEntries;
      if (shouldAddNewPrice(state, newPriceEntry)) {
        priceEntries = state.priceEntries.concat([newPriceEntry]);
      }

      return {
        ...state,
        priceEntries,
      };
    }
    default: {
      return state;
    }
  }
}

export function addPriceFromExtracted(data) {
  return {
    type: ADD_PRICE,
    extractedProductData: data,
  };
}

export function getPricesForProduct(state, productId) {
  const priceEntries = state.prices.priceEntries.filter(
    priceEntry => priceEntry.productId === productId,
  );
  return priceEntries.map(priceEntry => new Price(priceEntry));
}

export function getLatestPriceForProduct(state, productId) {
  const prices = getPricesForProduct(state, productId);
  return findMax(prices, price => price.date);
}

/**
 * Create a price entry from extracted product data.
 */
function priceEntryFromExtracted(data) {
  return {
    productId: getProductIdFromExtracted(data),
    amount: priceStringToAmount(data.price),
    date: data.date,
  };
}

/**
 * Determine if the given price entry should be added to the stored price
 * history.
 */
function shouldAddNewPrice(state, priceEntry) {
  const price = new Price(priceEntry);

  // Pretend this is global state so that the selector works. This isn't ideal,
  // but we don't hit this enough to generalize a fix.
  const latestPrice = getLatestPriceForProduct({prices: state}, price.productId);

  // Skip if the price hasn't changed.
  return !latestPrice.equals(price);
}
