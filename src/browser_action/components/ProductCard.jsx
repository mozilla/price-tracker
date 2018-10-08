/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import autobind from 'autobind-decorator';
import pt from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import {
  getActivePriceAlertForProduct,
  getLatestPriceForProduct,
  getOldestPriceForProduct,
  priceAlertShape,
  priceWrapperShape,
} from 'commerce/state/prices';
import {productShape} from 'commerce/state/products';
import * as productActions from 'commerce/state/products';

import 'commerce/browser_action/components/ProductCard.css';

/**
 * List item showing info about a product.
 */
@connect(
  (state, props) => ({
    latestPrice: getLatestPriceForProduct(state, props.product.id),
    originalPrice: getOldestPriceForProduct(state, props.product.id),
    activePriceAlert: getActivePriceAlertForProduct(state, props.product.id),
  }),
  {
    setDeletionFlag: productActions.setDeletionFlag,
  },
)
@autobind
export default class ProductCard extends React.Component {
  static propTypes = {
    // Direct props
    product: productShape.isRequired,

    // State props
    latestPrice: priceWrapperShape.isRequired,
    originalPrice: priceWrapperShape.isRequired,
    activePriceAlert: priceAlertShape,

    // Dispatch props
    setDeletionFlag: pt.func.isRequired,
  }

  static defaultProps = {
    activePriceAlert: null,
  }

  /**
   * Open the product's webpage in a new tab when it is clicked.
   * @param {Product} product
   */
  handleClick() {
    browser.tabs.create({url: this.props.product.url});
    window.close();
  }

  handleClickDelete(event) {
    event.stopPropagation();
    this.props.setDeletionFlag(this.props.product.id, true);
  }

  handleClickUndo() {
    this.props.setDeletionFlag(this.props.product.id, false);
  }

  render() {
    const {activePriceAlert, latestPrice, originalPrice, product} = this.props;

    // TODO: Update this to a proper undo state
    if (product.isDeleted) {
      return (
        <div className="product">
          <button type="button" onClick={this.handleClickUndo}>Undo Delete</button>
        </div>
      );
    }

    const priceDifference = originalPrice.percentDifference(latestPrice);
    return (
      <div className="product" onClick={this.handleClick}>
        <div className="prependum">
          {activePriceAlert && (
            <img
              className="icon price-alert"
              src={browser.extension.getURL('img/price_alert.svg')}
              alt="Price alert"
              title="Price alert"
            />
          )}
          <button type="button" className="ghost button delete" onClick={this.handleClickDelete}>
            <img
              className="icon"
              src={browser.extension.getURL('img/trash.svg')}
              alt="Stop tracking product"
            />
          </button>
        </div>

        <h3 className="title" title={product.title}>{product.title}</h3>

        <div className="details">
          <span className={`latest-price ${priceDifference < 0 ? 'price-decrease' : ''}`}>
            {latestPrice.amount.toFormat('$0.00')}
          </span>
          {priceDifference !== 0 && (
            <PriceDifference difference={priceDifference} />
          )}
          <span className="original-price">
            was <span className="amount">{originalPrice.amount.toFormat('$0.00')}</span>
          </span>
        </div>

        <img className="image" src={product.image} alt={product.title} />
      </div>
    );
  }
}

export class PriceDifference extends React.Component {
  static propTypes = {
    difference: pt.number.isRequired,
  }

  render() {
    const {difference} = this.props;
    if (difference > 0) {
      return (
        <span className="price-difference increase">
          ↑ {difference}%
        </span>
      );
    }

    if (difference < 0) {
      return (
        <span className="price-difference decrease">
          ↓ {difference}%
        </span>
      );
    }

    return null;
  }
}
