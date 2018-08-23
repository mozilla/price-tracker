/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import pt from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import EmptyOnboarding from 'commerce/browser_action/components/EmptyOnboarding';
import TrackedProductList from 'commerce/browser_action/components/TrackedProductList';
import {extractedProductShape, getAllProducts, productShape} from 'commerce/state/products';
import * as syncActions from 'commerce/state/sync';

/**
 * Base component for the entire panel. Handles loading state and whether to
 * display the empty state.
 */
@connect(
  state => ({
    products: getAllProducts(state),
  }),
  {
    loadStateFromStorage: syncActions.loadStateFromStorage,
  },
)
export default class BrowserActionApp extends React.Component {
  static propTypes = {
    // Direct props
    extractedProduct: extractedProductShape, // Product detected on the current page, if any

    // State props
    products: pt.arrayOf(productShape),

    // Dispatch props
    loadStateFromStorage: pt.func.isRequired,
  }

  static defaultProps = {
    products: [],
    extractedProduct: null,
  }

  componentDidMount() {
    this.props.loadStateFromStorage();
  }

  render() {
    const {products, extractedProduct} = this.props;
    if (products.length < 1) {
      return (
        <EmptyOnboarding extractedProduct={extractedProduct} />
      );
    }

    return (
      <TrackedProductList products={products} extractedProduct={extractedProduct} />
    );
  }
}
