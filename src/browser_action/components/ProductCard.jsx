/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import autobind from 'autobind-decorator';
import pt from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import {
  getOldestPriceForProduct,
  priceWrapperFromExtracted,
  priceShape,
} from 'commerce/state/prices';
import {extractedProductShape, productShape} from 'commerce/state/products';
import * as productActions from 'commerce/state/products';

import 'commerce/browser_action/components/ProductCard.css';

/**
 * Shows details about a single tracked product in the product listing.
 */
@connect(
  (state, props) => ({
    originalPrice: getOldestPriceForProduct(state, props.product.id),
  }),
)
export default class ProductCard extends React.Component {
  static propTypes = {
    // Direct props
    product: productShape.isRequired,

    // State props
    originalPrice: priceShape.isRequired,
  }

  render() {
    const {originalPrice, product} = this.props;
    return (
      <div className="product-card">
        <div className="product-info">
          <img className="image" src={product.image} alt={product.title} />
          <h3 className="title">{product.title}</h3>
          <div className="vendor">
            Placeholder &middot; {originalPrice.amount.toFormat('$0.00')}
          </div>
        </div>
      </div>
    );
  }
}

/**
 * Shows details about a product detected on the current page.
 */
@connect(null, {
  addProductFromExtracted: productActions.addProductFromExtracted,
})
@autobind
export class ExtractedProductCard extends React.Component {
  static propTypes = {
    // Direct props
    extractedProduct: extractedProductShape.isRequired,

    // Dispatch props
    addProductFromExtracted: pt.func.isRequired,
  }

  handleClickTrack() {
    this.props.addProductFromExtracted(this.props.extractedProduct);
  }

  render() {
    const {extractedProduct} = this.props;
    const price = priceWrapperFromExtracted(extractedProduct);
    return (
      <div className="extracted-product-card product-card">
        <div className="product-info">
          <img
            className="image"
            src={extractedProduct.image}
            alt={extractedProduct.title}
          />
          <h3 className="title">{extractedProduct.title}</h3>
          <div className="vendor">
            Placeholder &middot; {price.amount.toFormat('$0.00')}
          </div>
        </div>
        <button className="track-button" type="button" onClick={this.handleClickTrack}>
          Track This Item
        </button>
      </div>
    );
  }
}
