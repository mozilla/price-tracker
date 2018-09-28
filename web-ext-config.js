module.exports = {
  run: {
    pref: [
      'extensions.shopping@mozilla.org.priceCheckInterval=30000',
      'extensions.shopping@mozilla.org.priceCheckTimeoutInterval=30000',
      'extensions.shopping@mozilla.org.iframeTimeout=10000',
    ],
    startUrl: [
      'http://www.mkelly.me/fake-product-page/',
    ],
  },
};
