/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import ReactDOM from 'react-dom';
import pt from 'prop-types';

import Accordion from 'commerce/sidebar/components/Accordion';

import 'commerce/sidebar/index.css';

const PRODUCT_KEYS = ['title', 'image', 'price'];

class Sidebar extends React.Component {
  static propTypes = {
    product: pt.shape({
      title: pt.string,
      image: pt.string,
      price: pt.string,
    }),
  }

  static defaultProps = {
    product: undefined,
  }

  componentDidCatch() {
    // TODO: Show friendly message when errors happen.
  }

  render() {
    const {product} = this.props;
    return (
      <Accordion className="sidebar-container">
        {product && (
          <Accordion.Section title={`Current Page: ${product.title}`}>
            <ul>
              <li>{product.title || 'Unknown'}</li>
              <li>{product.image || 'Unknown'}</li>
              <li>{product.price || 'Unknown'}</li>
            </ul>
          </Accordion.Section>
        )}
        <Accordion.Section title="Collections" initial>
          <div>Collections</div>
        </Accordion.Section>
      </Accordion>
    );
  }
}

// Pull in product data from query parameters
const url = new URL(window.location);
const product = {
  title: url.searchParams.get('title'),
  image: url.searchParams.get('image'),
  price: url.searchParams.get('price'),
};
const isValidProduct = PRODUCT_KEYS.map(key => product[key]).every(val => val);

ReactDOM.render(
  <Sidebar product={isValidProduct ? product : undefined} />,
  document.getElementById('sidebar'),
);
