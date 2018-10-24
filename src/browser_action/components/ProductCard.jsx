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
import {getVendor, vendorShape} from 'commerce/state/vendors';
import {recordEvent} from 'commerce/telemetry/extension';

import 'commerce/browser_action/components/ProductCard.css';

/**
 * List item showing info about a product.
 */
@connect(
  (state, props) => ({
    latestPrice: getLatestPriceForProduct(state, props.product.id),
    originalPrice: getOldestPriceForProduct(state, props.product.id),
    activePriceAlert: getActivePriceAlertForProduct(state, props.product.id),
    vendor: getVendor(state, props.product.url),
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
    index: pt.number.isRequired,

    // State props
    latestPrice: priceWrapperShape.isRequired,
    originalPrice: priceWrapperShape.isRequired,
    activePriceAlert: priceAlertShape,
    vendor: vendorShape,

    // Dispatch props
    setDeletionFlag: pt.func.isRequired,
  }

  static defaultProps = {
    activePriceAlert: null,
    vendor: null,
  }

  /**
   * Open the product's webpage in a new tab when it is clicked.
   * @param {Product} product
   */
  async handleClick() {
    browser.tabs.create({url: this.props.product.url});
    await this.recordClickEvent('open_external_page', 'ui_element', {element: 'product_card'});
    window.close();
  }

  async handleClickDelete(event) {
    event.stopPropagation();
    this.props.setDeletionFlag(this.props.product.id, true);
    await this.recordClickEvent('delete_product', 'delete_button');
  }

  async handleClickUndo() {
    this.props.setDeletionFlag(this.props.product.id, false);
    await this.recordClickEvent('undo_delete_product', 'undo_button');
  }

  // Record click event in background script
  async recordClickEvent(method, object, extra = {}) {
    const {activePriceAlert, latestPrice, originalPrice, product, index} = this.props;
    await recordEvent(method, object, null, {
      ...extra,
      price: latestPrice.amount.getAmount(),
      // activePriceAlert is undefined if this product has never had a price alert
      price_alert: activePriceAlert ? activePriceAlert.active : false,
      price_orig: originalPrice.amount.getAmount(),
      product_index: index,
      product_key: product.anonId,
    });
  }

  render() {
    const {activePriceAlert, latestPrice, originalPrice, product, vendor} = this.props;

    if (product.isDeleted) {
      return (
        <button type="button" className="menu-item undo" onClick={this.handleClickUndo}>
          <img
            className="icon"
            src={browser.extension.getURL('/img/undo.svg')}
            alt="Keep tracking product"
          />
          <span>Undo Delete</span>
          <span className="sublabel title" title={product.title}>
            {product.title}
          </span>
        </button>
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
          {vendor && vendor.faviconUrl && (
            <img className="vendor-favicon" src={vendor.faviconUrl} alt="" />
          )}
          <span
            className={`latest-price ${priceDifference < 0 ? 'price-decrease' : ''}`}
            title={latestPrice.amount.toFormat('$0.00')}
          >
            {latestPrice.amount.toFormat('$0.00')}
          </span>
          {priceDifference !== 0 && (
            <PriceDifference difference={priceDifference} />
          )}
          <span className="original-price" title={originalPrice.amount.toFormat('$0.00')}>
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
