/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Converts a price element into a numerical price value in subunits (like cents).
 * e.g. <span>$10.00</span> returns 1000. If string parsing fails, returns NaN.
 * @param {HTMLElement} priceEle
 * @returns {Number} the price in subunits
 */
export function getPriceInSubunits(priceEle) {
  const priceUnits = getPriceUnits(priceEle.childNodes);
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
 * Extracts price units by filtering and cleaning textContent from text and DOM nodes
 * @param {Array.NodeList} nodes
 * @returns {Array.Number}
 */
function getPriceUnits(nodes) {
  const nodesArr = Array.from(nodes);
  // Separate token strings in a list into substrings using '$' and '.' as separators
  const allTokens = nodesArr.flatMap(token => token.textContent.split(/[.$]/));

  // Filter out any tokens that do not contain a digit
  const priceTokens = allTokens.filter(token => /\d/g.test(token));

  // Remove any non-digit characters for each token in the list
  const cleanedPriceTokens = priceTokens.map(token => token.replace(/\D/g, ''));

  // Convert price token strings to integers
  return cleanedPriceTokens.map(token => parseInt(token, 10));
}
