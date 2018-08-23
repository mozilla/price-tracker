/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import autobind from 'autobind-decorator';
import pt from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import ProductListItem from 'commerce/browser_action/components/ProductListItem';
import {FIRST_RUN_URL} from 'commerce/config';
import {getAllProducts, productShape} from 'commerce/state/products';
import * as syncActions from 'commerce/state/sync';

import 'commerce/browser_action/components/BrowserActionApp.css';

/**
 * Base component for the entire panel. Handles loading state and whether to
 * display the empty state.
 */
@connect(
  state => ({
    products: getAllProducts(state),
  }),
  {
    loadStateFromStorage: syncActions.loadStateFromStorage,
  },
)
export default class BrowserActionApp extends React.Component {
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
        <EmptyBrowserActionApp />
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

/**
 * Component shown when no products are currently being tracked.
 */
@autobind
export class EmptyBrowserActionApp extends React.Component {
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

  render() {
    return (
      <div className="empty-onboarding">
        <h1 className="cta">Get notified when the price drops!</h1>
        <div className="image">
          Animated image showing how the tool works.
        </div>
        <div className="description">
          Firefox can monitor this product and alert you when the price is right!
          &thinsp;
          <a href={FIRST_RUN_URL} onClick={this.handleClickLearnMore}>Learn more.</a>
        </div>
      </div>
    );
  }
}
