/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import pt from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import ProductCard from 'commerce/browser_action/components/ProductCard';
import TrackProductButton from 'commerce/browser_action/components/TrackProductButton';
import {getSortedProductsByOldestPrice} from 'commerce/state/prices';
import {extractedProductShape, productShape} from 'commerce/state/products';

import 'commerce/browser_action/components/TrackedProductList.css';

/**
 * List of products that are currently being tracked.
 */
@connect(
  (state, {products}) => ({
    sortedProducts: getSortedProductsByOldestPrice(state, products),
  }),
)
export default class TrackedProductList extends React.Component {
  static propTypes = {
    // Direct props
    /** List of tracked products to display */
    products: pt.arrayOf(productShape).isRequired, // eslint-disable-line react/no-unused-prop-types
    /** Product detected on the current page, if any */
    extractedProduct: extractedProductShape,

    // State props
    /** Tracked products sorted by their oldest logged price */
    sortedProducts: pt.arrayOf(productShape).isRequired,
  }

  static defaultProps = {
    extractedProduct: null,
  }

  render() {
    const {extractedProduct, sortedProducts} = this.props;
    return (
      <React.Fragment>
        <TrackProductButton className="menu-item" extractedProduct={extractedProduct} />
        <ul className="product-list">
          {sortedProducts.map((product, index) => (
            <li className="product-list-item" key={product.id}>
              <ProductCard product={product} index={index} />
            </li>
          ))}
        </ul>
      </React.Fragment>
    );
  }
}
