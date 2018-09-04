/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Redux duck for products that the user is monitoring for price changes.
 * @module
 */

import pt from 'prop-types';

// Types

/**
 * Data about a product as stored in the Redux state
 * @typedef Product
 * @type {object}
 */
export const productShape = pt.shape({
  id: pt.string.isRequired,
  title: pt.string.isRequired,
  url: pt.string.isRequired,
  image: pt.string.isRequired,
});

/**
 * Data about a product as extracted from a webpage by the content script
 * @typedef ExtractedProduct
 * @type {object}
 */
export const extractedProductShape = pt.shape({
  title: pt.string.isRequired,
  url: pt.string.isRequired,
  image: pt.string.isRequired,
  price: pt.string.isRequired,
  date: pt.string.isRequired,
});


// Actions

export const ADD_PRODUCT = 'commerce/products/ADD_PRODUCT'; // Used by price duck
const REMOVE_PRODUCT = 'commerce/products/REMOVE_PRODUCT';

// Reducer

function initialState() {
  return {
    products: [],
  };
}

export default function reducer(state = initialState(), action) {
  switch (action.type) {
    case ADD_PRODUCT: {
      const newProduct = getProductFromExtracted(action.extractedProductData);
      return {
        ...state,
        products: state.products.concat([newProduct]),
      };
    }
    case REMOVE_PRODUCT: {
      return {
        ...state,
        products: state.products.filter(
          product => product.id !== action.productId,
        ),
      };
    }
    default:
      return state;
  }
}

// Action Creators

/**
 * Add a new product to the store.
 * @param {ExtractedProduct} data
 */
export function addProductFromExtracted(data) {
  return {
    type: ADD_PRODUCT,
    extractedProductData: data,
  };
}

/**
 * Remove a product from the store.
 * @param {string} productId Unique ID for the product to remove.
 */
export function removeProduct(productId) {
  return {
    type: REMOVE_PRODUCT,
    productId,
  };
}

// Selectors

/**
 * Get every product saved in the store.
 * @param {ReduxState} state
 * @return {Product[]}
 */
export function getAllProducts(state) {
  return state.products;
}

/**
 * Get a single product saved in the store
 *
 * @param {ReduxState} state
 * @param {string} productId Unique ID for the product to fetch.
 * @return {Product|undefined}
 *  The matching product, or undefined if none was found.
 */
export function getProduct(state, productId) {
  return state.products.find(product => product.id === productId);
}

// Helpers

/**
 * Determine the unique ID for a product from extracted data.
 *
 * If you change this method, you must also migrate clients with older saved
 * product data to the new identifier.
 *
 * @param {ExtractedProduct} data
 * @return {string} Unique ID for the given product
 */
export function getProductIdFromExtracted(data) {
  const url = new URL(data.url);

  // Background update pages use a special hash value, we strip it out to
  // normalize and avoid missed updates.
  url.hash = '';

  return url.href;
}

/**
 * Generate a product suitable for the store from extracted data.
 * @param {ExtractedProduct} data
 * @return {Product} Product that can be stored in the state
 */
export function getProductFromExtracted(data) {
  return {
    id: getProductIdFromExtracted(data),
    title: data.title,
    url: data.url,
    image: data.image,
  };
}
