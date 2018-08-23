/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import pt from 'prop-types';
import React from 'react';

import {
  ExtractedProductCard,
  TrackedProductCard,
} from 'commerce/browser_action/components/ProductCard';
import {
  extractedProductShape,
  getProductIdFromExtracted,
  productShape,
} from 'commerce/state/products';

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

    // Remove the extracted product from the list if it is already tracked.
    // CurrentPageProduct will display it at the top instead.
    let trackedProducts = products;
    if (extractedProduct) {
      const extractedId = getProductIdFromExtracted(extractedProduct);
      trackedProducts = products.filter(product => product.id !== extractedId);
    }

    return (
      <div className="tracked-product-list">
        {extractedProduct && (
          <CurrentPageProduct extractedProduct={extractedProduct} products={products} />
        )}
        <h2 className="product-list-heading">Currently Tracking</h2>
        <ul className="product-list">
          {trackedProducts.map(product => (
            <li className="product-list-item" key={product.id}>
              <TrackedProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

/**
 * Product card displaying the product detected on the current page.
 */
export class CurrentPageProduct extends React.Component {
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

    // If the detected product is tracked, show a different card than for an
    // untracked product.
    const extractedId = getProductIdFromExtracted(extractedProduct);
    const matchExtractedProduct = products.find(
      product => product.id === extractedId,
    );

    return (
      <React.Fragment>
        {matchExtractedProduct
          ? <TrackedProductCard product={matchExtractedProduct} />
          : <ExtractedProductCard extractedProduct={extractedProduct} />
        }
        <hr />
      </React.Fragment>
    );
  }
}
