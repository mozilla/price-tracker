/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import ReactDOM from 'react-dom';
import pt from 'prop-types';

class Sidebar extends React.Component {
  render() {
    const {productTitle, productImage, productPrice} = this.props;
    return (
      <ul>
        <li>{productTitle || 'Unknown'}</li>
        <li>{productImage || 'Unknown'}</li>
        <li>{productPrice || 'Unknown'}</li>
      </ul>
    );
  }
}
Sidebar.propTypes = {
  productTitle: pt.string,
  productImage: pt.string,
  productPrice: pt.string,
};
Sidebar.defaultProps = {
  productTitle: null,
  productImage: null,
  productPrice: null,
};

// Pull in product data from query parameters
const url = new URL(window.location);
ReactDOM.render(
  <Sidebar
    productTitle={url.searchParams.get('title')}
    productImage={url.searchParams.get('image')}
    productPrice={url.searchParams.get('price')}
  />,
  document.getElementById('sidebar'),
);
