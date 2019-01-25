/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import autobind from 'autobind-decorator';
import React from 'react';

import TrackProductButton from 'commerce/browser_action/components/TrackProductButton';
import {extractedProductShape} from 'commerce/state/products';
import {recordEvent} from 'commerce/telemetry/extension';

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

  /**
   * Open a new tab and close the popup when links are clicked.
   */
  async handleClick(event) {
    if (event.target.href) {
      event.preventDefault();
      browser.tabs.create({url: event.target.href});
      await recordEvent('open_nonproduct_page', 'ui_element', null, {element: `${event.target.dataset.telemetryId}_link`});
      window.close();
    }
  }

  render() {
    const {extractedProduct} = this.props;
    return (
      <div className="empty-onboarding" onClick={this.handleClick}>
        <img className="hero" src={browser.extension.getURL('img/shopping-welcome.svg')} alt="" />
        {/*
          JSX deviates from HTML and removes newlines separating text nodes and components:
          https://reactjs.org/blog/2014/02/20/react-v0.9.html#jsx-whitespace

          We could futz with the margin on these components, but that would depend on how they're
          laid out here, which involves coordinating two files. The one-file solution is to add
          {' '} in the spots where whitespace would otherwise be collapsed.
        */}
        <p className="description">
          Add products from
          {' '}<a data-telemetry-id="amazon" href="https://www.amazon.com">Amazon</a>
          {' '}and <a data-telemetry-id="amazon_smile" href="https://smile.amazon.com">AmazonSmile</a>,
          {' '}<a data-telemetry-id="best_buy" href="https://www.bestbuy.com/">Best Buy</a>,
          {' '}<a data-telemetry-id="ebay" href="https://www.ebay.com/">eBay</a>,
          {' '}<a data-telemetry-id="home_depot" href="https://www.homedepot.com/">Home Depot</a> and
          {' '}<a data-telemetry-id="walmart" href="https://www.walmart.com/">Walmart</a>
          {' '}(U.S. domains only for now). When Price Wise finds a price drop, the add-on gives you a heads-up about the lower price.
        </p>
        <p className="description">
          Price Wise keeps track of your saved products by occasionally loading their webpages in
          the background while Firefox is open.
        </p>
        <TrackProductButton className="button" extractedProduct={extractedProduct} />
      </div>
    );
  }
}
