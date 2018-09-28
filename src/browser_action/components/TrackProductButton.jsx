/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import autobind from 'autobind-decorator';
import pt from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import * as productActions from 'commerce/state/products';
import {extractedProductShape, isProductTracked} from 'commerce/state/products';

/**
 * Button that tracks a product extracted from the current page when clicked.
 */
@connect(
  (state, {extractedProduct}) => ({
    isTracked: extractedProduct && isProductTracked(state, extractedProduct),
  }),
  {
    addProductFromExtracted: productActions.addProductFromExtracted,
  },
)
@autobind
export default class TrackProductButton extends React.Component {
  static propTypes = {
    // Direct props
    className: pt.string,
    extractedProduct: extractedProductShape,

    // State props
    isTracked: pt.bool.isRequired,

    // Dispatch props
    addProductFromExtracted: pt.func.isRequired,
  }

  static defaultProps = {
    className: '',
    extractedProduct: null,
  }

  /**
   * Track the current tab's product when the track button is clicked.
   */
  handleClickTrack() {
    this.props.addProductFromExtracted(this.props.extractedProduct);
  }

  render() {
    const {className, extractedProduct, isTracked} = this.props;
    return (
      <button
        type="button"
        className={`${className} track`}
        disabled={isTracked || !extractedProduct}
        onClick={this.handleClickTrack}
      >
        <img className="icon" src={browser.extension.getURL('img/shopping_add.svg')} alt="" />
        <span>Add This Product</span>
      </button>
    );
  }
}
