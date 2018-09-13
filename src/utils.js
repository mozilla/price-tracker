/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import checkPropTypes from 'check-prop-types';

/**
 * Resolves when the amount of time specified by delay has elapsed.
 */
export async function wait(delay) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delay);
  });
}

/**
 * Calls the given callback, retrying if it rejects or throws an error.
 * The delay between attempts increases per-try.
 *
 * @param {function} callback Function to call
 * @param {number} maxRetries Number of times to try calling
 * @param {number} delayFactor Multiplier for delay increase per-try
 * @param {number} initialDelay Initial delay in milliseconds
 */
export async function retry(callback, maxRetries = 5, delayFactor = 2, initialDelay = 1000) {
  /* eslint-disable no-await-in-loop */
  let delay = initialDelay;
  let lastError = null;
  for (let k = 0; k < maxRetries; k++) {
    try {
      // If we don't await here, the callback's promise will be returned
      // immediately instead of potentially failing.
      return await callback();
    } catch (err) {
      lastError = err;
      await wait(delay);
      delay *= delayFactor;
    }
  }
  throw lastError;
}

/**
 * Wrapper for check-prop-types to check a propType against a single value.
 * @param {*} value Value to validate
 * @param {PropType} propType The Proptype to validate value against
 * @return {string|undefined}
 *  Undefined if the validation was successful, or an error string explaining
 *  why it failed.
 */
export function validatePropType(value, propType) {
  return checkPropTypes({value: propType}, {value}, 'prop', 'Validation');
}

/**
 * Returns true if the string contains a number.
 */
function hasNumber(string) {
  return /\d/.test(string);
}

/**
 * Returns true if the string contains a dollar sign.
 */
function hasDollarSign(string) {
  return /\$/.test(string);
}

/**
 * Get the main and sub unit elements for the product price.
 *
 * @returns {Object} A string:element object with 'mainUnit' and 'subUnit' keys.
 */
export function getPriceUnitElements(element) {
  let isMainUnit = true;
  const priceElements = {};
  // Loop through children: first element containing a digit is main unit,
  // second is subunit.
  for (const priceSubEle of element.children) {
    if (hasNumber(priceSubEle.innerText)) {
      if (isMainUnit) {
        priceElements.mainUnit = priceSubEle;
        isMainUnit = false;
      } else {
        priceElements.subUnit = priceSubEle;
      }
    }
  }
  return priceElements;
}

/**
 * Reformats price string to be of form "$NX.XX".
 */
export function cleanPriceString(priceStr) {
  // Remove any commas
  let cleanedPriceStr = priceStr.replace(/,/g, '');
  // Add a '$' at the beginning if not present; common for strings pulled from element attributes
  if (!hasDollarSign) {
    cleanedPriceStr = cleanedPriceStr.replace(/^/, '$');
  }
  // Remove any characters preceding the '$' and following the '.XX'
  cleanedPriceStr = cleanedPriceStr.substring(cleanedPriceStr.indexOf('$'));
  cleanedPriceStr = cleanedPriceStr.substring(0, cleanedPriceStr.indexOf('.') + 3);
  return cleanedPriceStr;
}

/**
 * Checks if a price object has subunits and returns a price string.
 *
 * @param {HTMLElement} - The element containing the price
 * @param {String} extractUsing - The property/attribute to use to get the product price
 */
export function getPriceString(element, extractUsing) {
  if (element.children.length > 0) {
    const priceObj = getPriceUnitElements(element);
    // Check for subunits e.g. dollars and cents.
    if ('mainUnit' in priceObj) {
      const mainUnitStr = priceObj.mainUnit.innerText;
      // If no subunits, then main units contain subunits
      const subUnitStr = priceObj.subUnit ? `.${priceObj.subUnit.innerText}` : '';
      const priceStr = `${mainUnitStr}${subUnitStr}`;
      return cleanPriceString(hasDollarSign(priceStr) ? priceStr : `$${priceStr}`);
    }
  }
  const priceStr = extractValueFromElement(element, extractUsing);
  return cleanPriceString(priceStr);
}

/**
 * Extracts and returns the string value for a given element property or attribute.
 *
 * @param {HTMLElement} element
 * @param {String} extractUsing - The property/attribute to use to get the product price
 */
export function extractValueFromElement(element, extractUsing) {
  switch (extractUsing) {
    case 'content':
      return element.getAttribute('content');
    case 'innerText':
      return element.innerText;
    case 'src':
      return element.src;
    case 'value':
      return element.getAttribute('value');
    case 'aria-label':
      return element.getAttribute('aria-label');
    default:
      throw new Error(`Unrecognized extraction property or attribute '${extractUsing}'.`);
  }
}
