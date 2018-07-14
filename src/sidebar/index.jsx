/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import ReactDOM from 'react-dom';
import pt from 'prop-types';

const PRODUCT_KEYS = ['title', 'image', 'price'];

class Sidebar extends React.Component {
  render() {
    const {product} = this.props;
    return (
      <ul>
        <li>{product.title || 'Unknown'}</li>
        <li>{product.image || 'Unknown'}</li>
        <li>{product.price || 'Unknown'}</li>
      </ul>
    );
  }
}
Sidebar.propTypes = {
  product: pt.shape({
    title: pt.string,
    image: pt.string,
    price: pt.string,
  }),
};
Sidebar.defaultProps = {
  product: {},
};

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
