/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const OpenGraphPropertyValues = {
  title: "og:title",
  image: "og:image",
  price: "og:price:amount",
};

function getProductData() {
  const data = {};
  for (const [key, value] of Object.entries(OpenGraphPropertyValues)) {
    const metaEle = document.querySelector(`meta[property="${ value }"]`);
    if (metaEle) {
      data[key] = metaEle.getAttribute("content");
    }
  }
  // Note: HTML elements are not stringify-able, so can't be sent.
  browser.runtime.sendMessage({
    type: "product-data",
    data,
  });
}

// Make sure page has finished loading, as JS could alter the DOM.
if (document.readyState === "complete") {
  getProductData();
} else {
  window.addEventListener("load", () => {
    getProductData();
  });
}
