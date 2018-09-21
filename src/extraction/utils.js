/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Converts a price element (from Fathom extraction) or string (from fallback extraction) into
 * a numerical price value in subunits (like cents); e.g. <span>$10.00</span> and "$10.00" both
 * return 1000. If string parsing fails, returns NaN.
 * @param {HTMLElement|string} price
 * @returns {Number} the price in subunits
 */
export function getPriceInSubunits(price) {
  let priceUnits = [];
  if (typeof price === 'string') {
    priceUnits = getPriceUnitsFromStr(price);
  } else {
    priceUnits = getPriceUnitsFromArr(Array.from(price.childNodes));
  }
  // Convert units and subunits to a single integer value in subunits
  switch (priceUnits.length) {
    case 1:
      return priceUnits[0] * 100;
    case 2:
      return ((priceUnits[0] * 100) + priceUnits[1]);
    default:
      return NaN;
  }
}

/**
 * Extracts price units from textContent from text and/or DOM nodes
 * @param {Array} Array of DOM nodes
 * @returns {Array.Number}
 */
function getPriceUnitsFromArr(arr) {
  return cleanPriceTokens(arr.flatMap(token => splitString(token.textContent)));
}

/**
 * Extracts price units from a string
 * @param {String}
 * @returns {Array.Number}
 */
function getPriceUnitsFromStr(str) {
  return cleanPriceTokens(splitString(str));
}

/**
 * Filters and cleans string tokens
 * @param {Array.String}
 * @returns {Array.Number}
 */
function cleanPriceTokens(tokens) {
  // Filter out any tokens that do not contain a digit
  const priceTokens = tokens.filter(token => /\d/g.test(token));

  // Remove any non-digit characters for each token in the list
  const cleanedPriceTokens = priceTokens.map(token => token.replace(/\D/g, ''));

  // Convert price token strings to integers
  return cleanedPriceTokens.map(token => parseInt(token, 10));
}

/**
 * Separates a string into an array of substrings using '$' and '.' as separators
 */
function splitString(str) {
  return str.split(/[.$]/);
}
