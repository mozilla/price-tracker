/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import pt from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import {connect, Provider} from 'react-redux';

import store from 'commerce/state';
import {getPricesForProduct, priceShape} from 'commerce/state/prices';
import {getAllProducts, productShape} from 'commerce/state/products';
import * as syncActions from 'commerce/state/sync';

import 'commerce/browser_action/styles.css';

@connect(
  state => ({
    products: getAllProducts(state),
  }),
  {
    loadStateFromStorage: syncActions.loadStateFromStorage,
  },
)
class ProductManager extends React.Component {
  static propTypes = {
    // Direct props
    products: pt.arrayOf(productShape),

    // Dispatch props
    loadStateFromStorage: pt.func.isRequired,
  }

  static defaultProps = {
    products: [],
  }

  componentDidMount() {
    this.props.loadStateFromStorage();
  }

  render() {
    const {products} = this.props;
    if (products.length < 1) {
      return (
        <div>No Products saved</div>
      );
    }

    return (
      <ul>
        {products.map(product => (
          <ProductListItem product={product} key={product.id} />
        ))}
      </ul>
    );
  }
}

@connect(
  (state, props) => ({
    prices: getPricesForProduct(state, props.product.id),
  }),
)
class ProductListItem extends React.Component {
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

ReactDOM.render(
  <Provider store={store}>
    <ProductManager />
  </Provider>,
  document.getElementById('browser-action-app'),
);
