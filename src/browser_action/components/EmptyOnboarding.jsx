/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import autobind from 'autobind-decorator';
import pt from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import {FIRST_RUN_URL} from 'commerce/config';
import * as productActions from 'commerce/state/products';
import {extractedProductShape} from 'commerce/state/products';

import 'commerce/browser_action/components/EmptyOnboarding.css';

/**
 * Component shown when no products are currently being tracked.
 */
@connect(null, {
  addProductFromExtracted: productActions.addProductFromExtracted,
})
@autobind
export default class EmptyOnboarding extends React.Component {
  static propTypes = {
    // Direct props
    extractedProduct: extractedProductShape,

    // Dispatch props
    addProductFromExtracted: pt.func.isRequired,
  }

  static defaultProps = {
    extractedProduct: null,
  }

  /**
   * Open a new tab and close the popup when Learn More is clicked.
   */
  handleClickLearnMore(event) {
    event.preventDefault();
    browser.tabs.create({
      url: FIRST_RUN_URL,
    });
    window.close();
  }

  /**
   * Track the current tab's product when the track button is clicked.
   */
  handleClickTrack() {
    this.props.addProductFromExtracted(this.props.extractedProduct);
  }

  render() {
    const {extractedProduct} = this.props;
    return (
      <div className="empty-onboarding">
        <h1 className="cta">Get notified when the price drops!</h1>
        <div className="description">
          Firefox can monitor this product and alert you when the price is right!
          &thinsp;
          <a href={FIRST_RUN_URL} onClick={this.handleClickLearnMore}>Learn more.</a>
        </div>
        <button
          type="button"
          className="button watch"
          disabled={!extractedProduct}
          onClick={this.handleClickTrack}
        >
          <img className="icon" src={browser.extension.getURL('img/shopping_add.svg')} alt="" />
          Watch This Product
        </button>
      </div>
    );
  }
}
