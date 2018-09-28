/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {parsePrice} from 'commerce/extraction/utils';

function inUnits(fn) {
  return (element) => {
    const priceString = fn(element);
    return parsePrice([priceString]);
  };
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
        ['#priceblock_dealprice', inUnits(fromProperty('innerText'))],
        ['#priceblock_ourprice', inUnits(fromProperty('innerText'))],
        ['#price_inside_buybox', inUnits(fromProperty('innerText'))],
        ['#buybox .a-color-price', inUnits(fromProperty('innerText'))],
        ['input[name="displayedPrice"]', inUnits(fromAttribute('value'))],
        ['.a-size-large.a-color-price.guild_priceblock_ourprice', inUnits(fromProperty('innerText'))],
        ['.a-color-price.a-size-medium.a-align-bottom', inUnits(fromProperty('innerText'))],
        ['.display-price', inUnits(fromProperty('innerText'))],
        ['.offer-price', inUnits(fromProperty('innerText'))],
      ],
      image: [
        ['#landingImage', fromProperty('src')],
        ['#imgBlkFront', fromProperty('src')],
        ['#ebooksImgBlkFront', fromProperty('src')],
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
        ['.priceView-hero-price.priceView-purchase-price', inUnits(fromProperty('innerText'))],
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
        ['#prcIsum', inUnits(fromProperty('innerText'))],
        ['#orgPrc', inUnits(fromProperty('innerText'))],
        ['#mm-saleDscPrc', inUnits(fromProperty('innerText'))],
        ['.display-price', inUnits(fromProperty('innerText'))],
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
        ['#ajaxPriceAlt', inUnits(fromProperty('innerText'))],
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
        ['.PriceRange.prod-PriceHero', inUnits(fromProperty('innerText'))],
        ['.price-group', inUnits(fromAttribute('aria-label'))],
        ['.price-group', inUnits(fromProperty('innerText'))],
      ],
      image: [
        ['.prod-hero-image-image', fromProperty('src')],
        ['.prod-hero-image-carousel-image', fromProperty('src')],
      ],
    },
  },
  {
    domains: ['mkelly.me', 'www.mkelly.me'],
    features: {
      title: [
        ['#title', fromProperty('innerText')],
      ],
      price: [
        ['#price', inUnits(fromProperty('innerText'))],
      ],
      image: [
        ['img', fromProperty('src')],
      ],
    },
  },
];

export default fallbackExtractionData;
