module.exports = {
  run: {
    pref: [
      'extensions.shopping-testpilot@mozilla.org.priceCheckInterval=30000',
      'extensions.shopping-testpilot@mozilla.org.priceCheckTimeoutInterval=30000',
      'extensions.shopping-testpilot@mozilla.org.iframeTimeout=10000',
      'devtools.storage.extensionStorage.enabled=true',
    ],
    startUrl: [
      'http://mozilla.github.io/fake-product-page/',
      'about:debugging#/runtime/this-firefox',
    ],
  },
};
