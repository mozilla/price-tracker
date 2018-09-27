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

    // Dispatch props
    setDeletionFlag: pt.func.isRequired,
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
    const {latestPrice, originalPrice, product} = this.props;

    // TODO: Update this to a proper undo state
    if (product.isDeleted) {
      return (
        <div className="product">
          <button type="button" onClick={this.handleClickUndo}>Undo Delete</button>
        </div>
      );
    }

    return (
      <div className="product" onClick={this.handleClick}>
        <div className="prependum">
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
          <span className="latest-price">
            {latestPrice.amount.toFormat('$0.00')}
          </span>
          <span className="original-price">
            was <span className="amount">{originalPrice.amount.toFormat('$0.00')}</span>
          </span>
        </div>

        <img className="image" src={product.image} alt={product.title} />
      </div>
    );
  }
}
