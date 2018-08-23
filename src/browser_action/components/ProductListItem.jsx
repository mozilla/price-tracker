/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import pt from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import {getPricesForProduct, priceShape} from 'commerce/state/prices';
import {productShape} from 'commerce/state/products';

/**
 * Shows details about a single tracked product in the product listing.
 */
@connect(
  (state, props) => ({
    prices: getPricesForProduct(state, props.product.id),
  }),
)
export default class ProductListItem extends React.Component {
  static propTypes = {
    // Direct props
    product: productShape.isRequired,

    // State props
    prices: pt.arrayOf(priceShape),
  }

  static defaultProps = {
    prices: [],
  }

  render() {
    const {prices, product} = this.props;
    return (
      <li>
        <a href={product.url}>
          <img src={product.image} width="100" height="100" alt={product.title} />
          {product.title}
        </a>
        {prices.map(price => (
          <div key={price.date}>
            {price.amount.toFormat('$0.0')} ({price.date.toLocaleString()})
          </div>
        ))}
      </li>
    );
  }
}
