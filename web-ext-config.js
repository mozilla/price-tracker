module.exports = {
  run: {
    pref: [
      'extensions.shopping-testpilot@mozilla.org.priceCheckInterval=30000',
      'extensions.shopping-testpilot@mozilla.org.priceCheckTimeoutInterval=30000',
      'extensions.shopping-testpilot@mozilla.org.iframeTimeout=10000',
      'network.cookie.cookieBehavior=3', // See Issue #183
    ],
    startUrl: [
      'http://www.mkelly.me/fake-product-page/',
    ],
  },
};
