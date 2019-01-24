/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {parsePrice} from 'commerce/extraction/utils';

function inUnits(fn) {
  return (element) => {
    let tokens = fn(element);
    if (!Array.isArray(tokens)) {
      tokens = [tokens];
    }

    return parsePrice(tokens);
  };
}

function fromChildrenText() {
  return (element => Array.from(element.childNodes).map(node => node.textContent));
}

function fromProperty(property) {
  return (element => element[property]);
}

function fromAttribute(attribute) {
  return (element => element.getAttribute(attribute));
}


/**
 * CSS selector data by site, where each selector is paired with a method that
 * extracts the value from the element returned by that selector.
 */
const fallbackExtractionData = [
  {
    domains: ['amazon.com', 'www.amazon.com', 'smile.amazon.com'],
    features: {
      title: [
        ['#productTitle', fromProperty('innerText')],
        ['.product-title', fromProperty('innerText')],
      ],
      price: [
        ['#priceblock_dealprice', inUnits(fromChildrenText())],
        ['#priceblock_ourprice', inUnits(fromChildrenText())],
        ['#price_inside_buybox', inUnits(fromChildrenText())],
        ['#buybox .a-color-price', inUnits(fromChildrenText())],
        ['input[name="displayedPrice"]', inUnits(fromAttribute('value'))],
        ['.a-size-large.a-color-price.guild_priceblock_ourprice', inUnits(fromChildrenText())],
        ['.a-color-price.a-size-medium.a-align-bottom', inUnits(fromChildrenText())],
        ['.display-price', inUnits(fromChildrenText())],
        ['.offer-price', inUnits(fromChildrenText())],
      ],
      image: [
        ['#landingImage', fromProperty('src')],
        ['#imgBlkFront', fromProperty('src')],
        ['#ebooksImgBlkFront', fromProperty('src')],
        ['#main-image-container img', fromProperty('src')],
      ],
    },
  },
  {
    domains: ['bestbuy.com', 'www.bestbuy.com'],
    features: {
      title: [
        ['.sku-title h1', fromProperty('innerText')],
      ],
      price: [
        ['.priceView-hero-price.priceView-purchase-price', inUnits(fromChildrenText())],
      ],
      image: [
        ['img.primary-image', fromProperty('src')],
      ],
    },
  },
  {
    domains: ['ebay.com', 'www.ebay.com'],
    features: {
      title: [
        ['#itemTitle', fromProperty('innerText')],
        ['.product-title', fromProperty('innerText')],
      ],
      price: [
        ['#prcIsum', inUnits(fromChildrenText())],
        ['#orgPrc', inUnits(fromChildrenText())],
        ['#mm-saleDscPrc', inUnits(fromChildrenText())],
        ['.display-price', inUnits(fromChildrenText())],
      ],
      image: [
        ['#icImg', fromProperty('src')],
        ['.vi-image-gallery__image.vi-image-gallery__image--absolute-center', fromProperty('src')],
      ],
    },
  },
  {
    domains: ['homedepot.com', 'www.homedepot.com'],
    features: {
      title: [
        ['h1.product-title__title', fromProperty('innerText')],
      ],
      price: [
        ['#ajaxPrice', inUnits(fromAttribute('content'))],
        ['#ajaxPriceAlt', inUnits(fromChildrenText())],
      ],
      image: [
        ['#mainImage', fromProperty('src')],
      ],
    },
  },
  {
    domains: ['walmart.com', 'www.walmart.com'],
    features: {
      title: [
        ['h1.prod-ProductTitle', fromAttribute('content')],
        ['h1.prod-ProductTitle', fromProperty('innerText')],
      ],
      price: [
        ['.PriceRange.prod-PriceHero', inUnits(fromChildrenText())],
        ['.price-group', inUnits(fromAttribute('aria-label'))],
        ['.price-group', inUnits(fromChildrenText())],
      ],
      image: [
        ['.prod-hero-image-image', fromProperty('src')],
        ['.prod-hero-image-carousel-image', fromProperty('src')],
      ],
    },
  },
  {
    domains: ['mozilla.github.io'],
    features: {
      title: [
        ['#title', fromProperty('innerText')],
      ],
      price: [
        ['#price', inUnits(fromChildrenText())],
      ],
      image: [
        ['img', fromProperty('src')],
      ],
    },
  },
];

export default fallbackExtractionData;
