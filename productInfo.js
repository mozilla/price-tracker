"use strict";

class ProductInfo {
  constructor() {
    this.OpenGraphPropertyValues = {
      title: "og:title",
      image: "og:image",
      price: "og:price:amount",
    }
    this.getProductData();
  }

  getProductData() {
    let productData = {};
    for (let key in this.OpenGraphPropertyValues) {
      const metaEle = document.querySelector(`meta[property="${this.OpenGraphPropertyValues[key]}"]`);
      if (metaEle) {
        productData[key] = metaEle.getAttribute("content");
      } else {
        console.log(`No info found for the product ${ key }.`);
        productData[key] = null;
      }
    }
    // Note: Can't send HTML elements to background.js; they are not stringify-able
    browser.runtime.sendMessage({
                                  type: "product-data",
                                  data: productData,
                                });
  }
}

const productInfo = new ProductInfo();
