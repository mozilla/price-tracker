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
  isDeleted: pt.bool.isRequired, // flag to include in returned list of products from store
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
const DELETE_PRODUCT = 'commerce/products/DELETE_PRODUCT';
const UNDELETE_PRODUCT = 'commerce/products/UNDELETE_PRODUCT';
const DELETE_MARKED_PRODUCTS = 'commerce/products/DELETE_MARKED_PRODUCTS';

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
    case DELETE_PRODUCT: {
      return {
        ...state,
        products: state.products.map((product) => {
          if (product.id === action.productId) {
            const flaggedProduct = {...product};
            flaggedProduct.isDeleted = true;
            return flaggedProduct;
          }
          return product;
        }),
      };
    }
    case UNDELETE_PRODUCT: {
      return {
        ...state,
        products: state.products.map((product) => {
          if (product.id === action.productId) {
            const flaggedProduct = {...product};
            flaggedProduct.isDeleted = false;
            return flaggedProduct;
          }
          return product;
        }),
      };
    }
    case DELETE_MARKED_PRODUCTS: {
      return {
        ...state,
        products: state.products.filter(product => !product.isDeleted),
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
 * Mark a product as deleted in the store.
 * @param {string} productId Unique ID for the product to remove.
 */
export function deleteProduct(productId) {
  return {
    type: DELETE_PRODUCT,
    productId,
  };
}

/**
 * Mark a product as undeleted in the store.
 * @param {string} productId Unique ID for the product to remove.
 */
export function undeleteProduct(productId) {
  return {
    type: UNDELETE_PRODUCT,
    productId,
  };
}

/**
 * Remove all products marked as deleted from the store.
 * @param {string} productId Unique ID for the product to remove.
 */
export function deleteMarkedProducts() {
  return {
    type: DELETE_MARKED_PRODUCTS,
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
    isDeleted: false,
  };
}
