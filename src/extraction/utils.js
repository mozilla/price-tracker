/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Converts an array of price tokens into a numerical price value in subunits.
 * E.g. ["$10.00"] and ["$", "10", "00", "/each"] both return 1000.
 * If string parsing fails, returns NaN.
 * @param {Array.String} The price token strings extracted from the page
 * @returns {Number} the price in subunits
 */
export function parsePrice(tokens) {
  const priceUnits = (
    tokens
      // Split tokens by $ and . to get the numbers between them
      .flatMap(token => token.split(/[.$]/))
      // Filter out any tokens that do not contain a digit
      .filter(token => /\d/g.test(token))
      // Remove any non-digit characters for each token in the list
      .map(token => token.replace(/\D/g, ''))
      // Convert price token strings to integers
      .map(token => parseInt(token, 10))
  );

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
