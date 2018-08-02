/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import autobind from 'autobind-decorator';
import Dinero from 'dinero.js';
import pt from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import {connect, Provider} from 'react-redux';

import store from 'commerce/state';
import {
  addProductFromExtracted,
  getProduct,
  getProductIdFromExtracted,
  extractedProductShape,
  productShape,
} from 'commerce/state/products';
import {loadStateFromStorage} from 'commerce/state/sync';
import {priceStringToAmount} from 'commerce/utils';

import 'commerce/page_action/styles.css';

@connect(
  (state, props) => ({
    savedProduct: getProduct(state, props.productId),
  }),
  {addProductFromExtracted, loadStateFromStorage},
)
@autobind
class ProductViewer extends React.Component {
  static propTypes = {
    extractedProduct: extractedProductShape.isRequired,

    savedProduct: productShape,

    addProductFromExtracted: pt.func.isRequired,
    loadStateFromStorage: pt.func.isRequired,
  }

  static defaultProps = {
    savedProduct: null,
  }

  componentDidMount() {
    this.props.loadStateFromStorage();
  }

  handleClickTrack() {
    const {extractedProduct} = this.props;
    this.props.addProductFromExtracted(extractedProduct);
  }

  render() {
    const {extractedProduct, savedProduct} = this.props;
    if (savedProduct) {
      return (
        <div>You are tracking this product.</div>
      );
    }

    const amount = Dinero({
      amount: priceStringToAmount(extractedProduct.price),
    });
    return (
      <div>
        <h2>{extractedProduct.title}</h2>
        <div>{amount.toFormat('$0.0')}</div>
        <button type="button" onClick={this.handleClickTrack}>
          Track
        </button>
      </div>
    );
  }
}

const url = new URL(window.location.href);
const extractedProduct = JSON.parse(url.searchParams.get('extractedProduct'));
const productId = getProductIdFromExtracted(extractedProduct);
ReactDOM.render(
  <Provider store={store}>
    <ProductViewer productId={productId} extractedProduct={extractedProduct} />
  </Provider>,
  document.getElementById('app'),
);
