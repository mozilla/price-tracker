module.exports = {
  run: {
    pref: [
      'extensions.shopping@mozilla.org.priceCheckInterval=6000',
      'extensions.shopping@mozilla.org.priceCheckTimeoutInterval=6000',
      'extensions.shopping@mozilla.org.iframeTimeout=5000',
    ],
    startUrl: [
      'http://www.mkelly.me/fake-product-page/',
    ],
  },
};
