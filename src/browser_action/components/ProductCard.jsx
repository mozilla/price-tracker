/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import autobind from 'autobind-decorator';
import pt from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import {
  getLatestPriceForProduct,
  getOldestPriceForProduct,
  priceWrapperFromExtracted,
  priceShape,
} from 'commerce/state/prices';
import {extractedProductShape, productShape} from 'commerce/state/products';
import * as productActions from 'commerce/state/products';

import 'commerce/browser_action/components/ProductCard.css';

/**
 * Base component for showing info about a product.
 */
@autobind
export default class ProductCard extends React.Component {
  static propTypes = {
    // Direct props

    /** If provided, displays a button in the card with the given text */
    buttonText: pt.string,

    /** URL to an image of the product to show */
    imageUrl: pt.string.isRequired,

    /** Latest fetched price for the product */
    latestPrice: priceShape,

    /** Function to run when the button is clicked, if it is shown */
    onClickButton: pt.func,

    /** Function to run when the close button is clicked, if it is shown */
    onClickClose: pt.func,

    /** The price of the product when it was first tracked. */
    originalPrice: priceShape.isRequired,

    /**
     * If true, show a close icon on hover in the top right corner.
     * Will not be shown if latestPrice is not provided.
     */
    showClose: pt.bool,

    /** Title of the product */
    title: pt.string.isRequired,
  }

  static defaultProps = {
    buttonText: null,
    latestPrice: null,
    onClickButton: () => {},
    onClickClose: () => {},
    showClose: false,
  }

  handleClickButton(event) {
    this.props.onClickButton(event);
  }

  handleClickClose(event) {
    this.props.onClickClose(event);
  }

  render() {
    const {
      buttonText,
      imageUrl,
      latestPrice,
      originalPrice,
      showClose,
      title,
    } = this.props;

    return (
      <div className="product-card">
        {latestPrice && (
          <div className="latest-price">
            {latestPrice.amount.toFormat('$0.00')}
            {showClose && (
              <button className="close-button" type="button" onClick={this.handleClickClose}>
                <img
                  alt="Stop tracking product"
                  className="close-icon"
                  src={browser.extension.getURL('/img/close.svg')}
                />
              </button>
            )}
          </div>
        )}
        <div className="product-info">
          <img className="image" src={imageUrl} alt={title} />
          <h3 className="title">{title}</h3>
          <div className="vendor">
            Placeholder &middot; was {originalPrice.amount.toFormat('$0.00')}
          </div>
        </div>
        {buttonText && (
          <button className="button" type="button" onClick={this.handleClickButton}>
            {buttonText}
          </button>
        )}
      </div>
    );
  }
}


/**
 * Shows details about a single tracked product in the product listing.
 */
@connect(
  (state, props) => ({
    latestPrice: getLatestPriceForProduct(state, props.product.id),
    originalPrice: getOldestPriceForProduct(state, props.product.id),
  }),
  {removeProduct: productActions.removeProduct},
)
@autobind
export class TrackedProductCard extends React.Component {
  static propTypes = {
    // Direct props
    product: productShape.isRequired,

    // State props
    latestPrice: priceShape.isRequired,
    originalPrice: priceShape.isRequired,

    // Dispatch props
    removeProduct: pt.func.isRequired,
  }

  /**
   * Stop tracking the product when the close button is clicked.
   */
  handleClickClose() {
    this.props.removeProduct(this.props.product.id);
  }

  render() {
    const {latestPrice, originalPrice, product, ...props} = this.props;
    return (
      <ProductCard
        imageUrl={product.image}
        latestPrice={latestPrice}
        onClickClose={this.handleClickClose}
        originalPrice={originalPrice}
        showClose
        title={product.title}
        {...props}
      />
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
    const {extractedProduct, ...props} = this.props;
    const price = priceWrapperFromExtracted(extractedProduct);
    return (
      <ProductCard
        buttonText="Track This Item"
        imageUrl={extractedProduct.image}
        onClickButton={this.handleClickTrack}
        originalPrice={price}
        title={extractedProduct.title}
        {...props}
      />
    );
  }
}
