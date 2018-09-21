/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {getPriceInSubunits} from 'commerce/extraction/utils';

function inUnits(fn) {
  return element => getPriceInSubunits(fn(element));
}

function fromProperty(property) {
  return (element => element[property]);
}

function fromAttribute(attribute) {
  return (element => element.getAttribute(attribute));
}


/**
 * CSS selector data by site (represented by a string of acceptable hostnames), where each
 * selector is paired with a method that extracts the value from the element returned by
 * that selector.
 */
const fallbackExtractionData = {
  'amazon.com_www.amazon.com_smile.amazon.com': {
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
  'bestbuy.com_www.bestbuy.com': {
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
  'ebay.com_www.ebay.com': {
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
  'homedepot.com_www.homedepot.com': {
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
  'walmart.com_www.walmart.com': {
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
  'mkelly.me_www.mkelly.me': {
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
};

export default fallbackExtractionData;
