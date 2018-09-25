/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import pt from 'prop-types';
import React from 'react';

import ProductCard from 'commerce/browser_action/components/ProductCard';
import TrackProductButton from 'commerce/browser_action/components/TrackProductButton';
import {extractedProductShape, productShape} from 'commerce/state/products';

import 'commerce/browser_action/components/TrackedProductList.css';

/**
 * List of products that are currently being tracked.
 */
export default class TrackedProductList extends React.Component {
  static propTypes = {
    // Direct props
    /** List of tracked products to display */
    products: pt.arrayOf(productShape).isRequired,
    /** Product detected on the current page, if any */
    extractedProduct: extractedProductShape,
  }

  static defaultProps = {
    extractedProduct: null,
  }

  render() {
    const {extractedProduct, products} = this.props;
    return (
      <React.Fragment>
        <TrackProductButton className="menu-item" extractedProduct={extractedProduct} />
        <ul className="product-list">
          {products.map(product => (
            <li className="product-list-item" key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </React.Fragment>
    );
  }
}
