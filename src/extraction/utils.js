/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Converts a price element into a numerical price value checking for subunits (like cents).
 * e.g. <span>$10.00</span> returns 1000. If string parsing fails, returns NaN.
 * @param {HTMLElement} priceEle
 * @returns {Number} An integer that represents the price in subunits
 */
export function getPriceIntegerInSubunits(priceEle) {
  // Get all child nodes including text nodes
  const childNodes = priceEle.childNodes;
  const allTokens = getAllTokens(childNodes);
  const priceTokens = getPriceTokens(allTokens);
  const cleanedPriceTokens = cleanPriceTokens(priceTokens);
  // Convert units and subunits to a single integer value in subunits
  const mainUnits = parseInt(cleanedPriceTokens[0], 10) * 100;
  const subUnits = cleanedPriceTokens.length === 2 ? parseInt(cleanedPriceTokens[1], 10) : 0;
  return mainUnits + subUnits;
}

/**
 * Separate token strings in a list into substrings using '$' and '.' as separators
 * @param {Array.string} tokens
 * @returns {Array.string}
 */
function getAllTokens(tokens) {
  const allTokens = [];
  let shouldPush = true;
  for (const node of tokens) {
    const text = node.textContent;
    for (const char of text) {
      if (char === '$' || char === '.') {
        shouldPush = false;
        const [firstStr, secondStr] = text.split(char);
        if (firstStr.length > 0) {
          allTokens.push(firstStr);
        }
        allTokens.push(char);
        // Only push if there is a substring after the split and the '.' separator is not present
        if (secondStr.length > 0 && secondStr !== char && !(secondStr.includes('.'))) {
          allTokens.push(secondStr);
        }
      }
    }
    if (shouldPush) {
      allTokens.push(text);
    } else {
      shouldPush = true;
    }
  }
  return allTokens;
}

/**
 * Filter a list of string tokens for those containing digits
 * @param {Array.strings} tokens
 * @returns {Array.strings}
 */
function getPriceTokens(tokens) {
  return tokens.filter(token => /\d/g.test(token));
}

/**
 * Remove any non-digit characters for each string in the list
 * @param {Array.strings} tokens
 * @returns {Array.strings}
 */
function cleanPriceTokens(priceTokens) {
  const result = [];
  for (const token of priceTokens) {
    result.push(token.replace(/\D/g, ''));
  }
  return result;
}
