/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Redux duck for products that the user is monitoring for price changes.
 */

import pt from 'prop-types';

export const ADD_PRODUCT = 'commerce/products/ADD_PRODUCT'; // Used by price duck
const REMOVE_PRODUCT = 'commerce/products/REMOVE_PRODUCT';

export const productShape = pt.shape({
  id: pt.string.isRequired,
  title: pt.string.isRequired,
  url: pt.string.isRequired,
  image: pt.string.isRequired,
});

export const extractedProductShape = pt.shape({
  title: pt.string.isRequired,
  url: pt.string.isRequired,
  image: pt.string.isRequired,
  price: pt.string.isRequired,
  date: pt.string.isRequired,
});

function initialState() {
  return {
    savedProducts: [],
  };
}

export default function reducer(state = initialState(), action) {
  switch (action.type) {
    case ADD_PRODUCT: {
      const data = action.extractedProductData;
      const newProduct = {
        id: getProductIdFromExtracted(data),
        title: data.title,
        url: data.url,
        image: data.image,
      };

      return {
        ...state,
        savedProducts: state.savedProducts.concat([newProduct]),
      };
    }
    case REMOVE_PRODUCT: {
      return {
        ...state,
        savedProducts: state.savedProducts.filter(
          product => product.id !== action.productId,
        ),
      };
    }
    default:
      return state;
  }
}

export function addProductFromExtracted(data) {
  return {
    type: ADD_PRODUCT,
    extractedProductData: data,
  };
}

export function removeProduct(productId) {
  return {
    type: REMOVE_PRODUCT,
    productId,
  };
}

export function getAllProducts(state) {
  return state.products.savedProducts;
}

export function getProduct(state, productId) {
  return state.products.savedProducts.find(product => product.id === productId);
}

export function getProductIdFromExtracted(data) {
  return data.url;
}
