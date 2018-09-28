/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import autobind from 'autobind-decorator';
import React from 'react';

import TrackProductButton from 'commerce/browser_action/components/TrackProductButton';
import {extractedProductShape} from 'commerce/state/products';

import 'commerce/browser_action/components/EmptyOnboarding.css';

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

  render() {
    const {extractedProduct} = this.props;
    return (
      <div className="empty-onboarding">
        <h1 className="cta">Get notified when the price drops!</h1>
        <div className="description">
          Firefox can monitor this product and alert you when the price is right!
        </div>
        <TrackProductButton className="button" extractedProduct={extractedProduct} />
      </div>
    );
  }
}
