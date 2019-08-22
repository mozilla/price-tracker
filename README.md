# Price Tracker

Price Tracker is a Firefox extension that tracks price changes to help you find the best time to buy.

**IMPORTANT: Price Tracker is no longer under active development. Official support for Price Tracker ends on September 30, 2019.**

## Data Collection

See [METRICS.md](./docs/METRICS.md).


## Developer Setup

Prerequisites:

- A recent version of Node.js and NPM

1. Clone the repository:

   ```sh
   git clone https://github.com/mozilla/price-tracker.git
   cd price-tracker
   ```
2. Install dependencies:

   ```sh
   npm install
   ```
3. Build the extension:

   ```sh
   npm run build
   ```
4. Run the built extension in a test browser:

   ```sh
   npm start
   ```

Note: This will install the extension as an [unsigned](https://wiki.mozilla.org/Add-ons/Extension_Signing) [WebExtension Experiment](https://firefox-source-docs.mozilla.org/toolkit/components/extensions/webextensions/basics.html#webextensions-experiments).
* Unsigned WebExtension Experiments can only be run in Nightly and DevEdition with boolean `about:config` preferences `xpinstall.signatures.required` set to `false` and `extensions.legacy.enabled` set to `true`.
* To test an unsigned WebExtension Experiment in Firefox Beta or Release, an [unbranded build](https://wiki.mozilla.org/Add-ons/Extension_Signing#Unbranded_Builds) must be used.


## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Launch Firefox with the extension temporarily installed |
| `npm run lint` | Run linting checks |
| `npm run build` | Compile source files with Webpack using a development configuration |
| `npm run build:prod` | Compile source files with Webpack using a production configuration |
| `npm run watch` | Watch for changes and rebuild with Webpack using a development configuration|
| `npm run watch:prod` | Watch for changes and rebuild with Webpack using a production configuration|
| `npm run package` | Package the extension into an XPI file |
| `pipenv run test` | Run test suite (See "Running Tests" for setup) |


## Data Storage

Global state for the add-on is managed via [Redux][]. Any time the data is changed, it is persisted to the [add-on local storage][localstorage].

Reducers, action creators, etc. are organized into [ducks][] inside the `src/state` directory.

[Redux]: https://redux.js.org/
[localstorage]: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/local
[ducks]: https://github.com/erikras/ducks-modular-redux


## Testing

### Fake Product Test Page

A [fake product page][] is available for testing the add-on. The price on the page changes upon refresh, and URL parameters can be used to manually set the price.

See the [github repo][fake-page-repo] for more details.

[fake product page]: https://mozilla.github.io/fake-product-page/
[fake-page-repo]: https://github.com/mozilla/fake-product-page/

### Running Tests

Automated tests are run in a Firefox browser instance using [Marionette][]. We use the Python client for Marionette since there is no up-to-date JavaScript client.

To set up your environment for running the tests, you must have:

- A Firefox binary. On MacOS, this can be found within the `.app` folder at  `Firefox.app/Contents/MacOS/firefox`.
- Python 2.7
- [Pipenv][]

With these installed, you can set up the test suite:

1. Install Python dependencies:

   ```sh
   pipenv install
   ```
2. Save the path to your Firefox binary with `npm`:

   ```sh
   npm config set price-tracker:firefox_bin <PATH_TO_FIREFOX_BINARY>
   ```

After this, you can run `pipenv run test` to run the automated test suite.

[Marionette]: https://firefox-source-docs.mozilla.org/testing/marionette/marionette/index.html
[Pipenv]: https://docs.pipenv.org/

### Preferences

The following preferences can be set to customize the extension's behavior for testing purposes. Some convenient testing values can be found in [web-ext-config.js](web-ext-config.js), and will be used by default with `npm start`.

<dl>
  <dt><code>extensions.shopping-testpilot@mozilla.org.extractionAllowlist</code></dt>
  <dd>(<code>string</code>) List of domains (<code>{Array.string}</code> or <code>*</code>) that extraction is performed on. Can be set to <code>*</code> to enable extraction on all sites.</dd>

  <dt><code>extensions.shopping-testpilot@mozilla.org.priceCheckInterval</code></dt>
  <dd>(<code>integer</code>) Time to wait between price checks for a product in milliseconds.</dd>

  <dt><code>extensions.shopping-testpilot@mozilla.org.priceCheckTimeoutInterval</code></dt>
  <dd>(<code>integer</code>) Time to wait between checking if we should fetch new prices in milliseconds.</dd>

  <dt><code>extensions.shopping-testpilot@mozilla.org.iframeTimeout</code></dt>
  <dd>(<code>integer</code>) Delay before removing iframes created during price checks in milliseconds.</dd>

  <dt><code>extensions.shopping-testpilot@mozilla.org.alertPercentThreshold</code></dt>
  <dd>(<code>integer</code>) The percentage drop in price on which to trigger a price alert compared to the last high price (See <code>price_last_high</code> in [METRICS.md](./docs/METRICS.md)).</dd>

  <dt><code>extensions.shopping-testpilot@mozilla.org.alertAbsoluteThreshold</code></dt>
  <dd>(<code>integer</code>) The absolute drop in price on which to trigger a price alert compared to the last high price (see `price_last_high` in [METRICS.md](./docs/METRICS.md)) in currency subunits (e.g. cents for USD).</dd>
</dl>


## Releasing a New Version

Price Tracker bumps the major version number for every release, similar to Firefox. Releases are created by tagging a commit that bumps the version number and pushing that tag to the repo. This triggers CircleCI automation that packages, tests, signs and uploads the new version to the Test Pilot S3 bucket.

It is strongly recommended that developers creating releases [configure Git to
sign their commits and tags][signing].

To create a new release of Price Tracker:

1. Increment the version number in `package.json`, create a new commit on the `master` branch with this change, and create a new git tag pointing to the commit with a name of the form `v1.0.0`, where `1.0.0` is the new version number.

   `npm` ships with a command that can perform these steps for you automatically:

   ```sh
   npm version major
   ```
2. Push the updated `master` branch and the new tag to the remote for the Mozilla Price Tracker repository (named `origin` in the example below):

   ```sh
   git push origin master
   git push origin v1.0.0
   ```

You can follow along with the build and upload progress for the new release on the [CircleCI dashboard][]. Once the build finishes, a signed copy of the new version will be available in the dashboard under Artifacts. The following upload job, however, is gated on a hold job.

This hold job is intended to provide developers and QA an opportunity for final testing and review of the extension in release channels before uploading. When QA is satisfied, a developer with push access must manually trigger the upload to Test Pilot via the CircleCI dashboard by clicking the hold job and approving the build.

Once the upload is complete, the new version should be available immediately at https://testpilot.firefox.com/files/shopping-testpilot@mozilla.org/latest.

[signing]: https://help.github.com/articles/signing-commits/
[CircleCI dashboard]: https://circleci.com/dashboard


## License

The Commerce WebExtension is licensed under the MPL v2.0. See [`LICENSE`](LICENSE) for details.
