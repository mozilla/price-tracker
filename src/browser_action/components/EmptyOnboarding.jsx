/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import autobind from 'autobind-decorator';
import React from 'react';

import TrackProductButton from 'commerce/browser_action/components/TrackProductButton';
import {extractedProductShape} from 'commerce/state/products';

import 'commerce/browser_action/components/EmptyOnboarding.css';

const FIRST_RUN_URL = browser.extension.getURL('/first_run/index.html');

/**
 * Component shown when no products are currently being tracked.
 */
@autobind
export default class EmptyOnboarding extends React.Component {
  static propTypes = {
    // Direct props
    extractedProduct: extractedProductShape,
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
        <TrackProductButton className="button" extractedProduct={extractedProduct} />
      </div>
    );
  }
}
