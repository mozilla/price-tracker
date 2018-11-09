# Price Wise

Price Wise is a Firefox extension that tracks price changes to help you find the best time to buy.


## User Experience

See [UX specifications](https://mozilla.invisionapp.com/share/UFNSHAIMT4V#/screens/317130676_Artboard_1).


## Telemetry

See [METRICS.md](./docs/METRICS.md).


## Developer Setup

Prerequisites:

- A recent version of Node.js and NPM

1. Clone the repository:

   ```sh
   git clone https://github.com/mozilla/price-wise.git
   cd price-wise
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


## Code Organization

- `src/background` contains the background scripts that trigger UI elements (such as the browserAction toolbar button) and periodically check for price updates.
- `src/browser_action` contains the toolbar popup for managing the list of currently-tracked products and tracking new products.
- `src/config` contains the scripts used to fetch config values specified in [config.js](src/config.js).
- `src/experiment_apis` contains the [experimental APIs](https://firefox-source-docs.mozilla.org/toolkit/components/extensions/webextensions/basics.html#webextensions-experiments) used to read [preference values](#preferences) and listen for chrome-privileged Firefox events. 
- `src/extraction` contains the content scripts that extract product information from product web pages.
- `src/img` contains all the non-favicon images used by the extension.
- `src/state` contains the Redux-based code for managing global extension state.
- `src/styles` contains Firefox-specific CSS property values stored as variables.
- `src/telemetry` contains the scripts used to register and record extension [telemetry events](https://firefox-source-docs.mozilla.org/toolkit/components/telemetry/telemetry/collection/events.html) in different contexts.
- `src/tests` contains the automated test suite.
- `config.js` contains the static configuration settings for the extension, including default values if [override preferences](#preferences) are not set.
- `manifest.json` contains basic metadata about the extension.
- `privacy.js` handles checking privacy settings to gate functionality across the extension.
- `utils.js` contains general utility functions that can be used across the extension.


## Data Storage

Global state for the add-on is managed via [Redux][]. Any time the data is changed, it is persisted to the [add-on local storage][localstorage].

Reducers, action creators, etc. are organized into [ducks][] inside the `src/state` directory.

[Redux]: https://redux.js.org/
[localstorage]: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/local
[ducks]: https://github.com/erikras/ducks-modular-redux


## Testing

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
   npm config set price-wise:firefox_bin <PATH_TO_FIREFOX_BINARY>
   ```

After this, you can run `pipenv run test` to run the automated test suite.

[Marionette]: https://firefox-source-docs.mozilla.org/testing/marionette/marionette/index.html
[Pipenv]: https://docs.pipenv.org/

### Preferences

The following preferences can be set to customize the extension's behavior for testing purposes. Some convenient testing values can be found in [web-ext-config.js](web-ext-config.js), and will be used by default with `npm start`.

<dl>
  <dt><code>extensions.shopping-testpilot@mozilla.org.extractionAllowlist</code></dt>
  <dd>Preference type: string. List of domains (<code>{Array.string}</code> or <code>*</code>) that extraction is performed on. Can be set to <code>*</code> to enable extraction on all sites (default: <code>extractionAllowlist</code> value specified in [config.js](src/config.js).</dd>

  <dt><code>extensions.shopping-testpilot@mozilla.org.priceCheckInterval</code></dt>
  <dd>Preference type: integer. Time to wait between price checks for a product in milliseconds (default: <code>21600000</code> or 6 hours).</dd>

  <dt><code>extensions.shopping-testpilot@mozilla.org.priceCheckTimeoutInterval</code></dt>
  <dd>Preference type: integer. Time to wait between checking if we should fetch new prices in milliseconds (default: <code>900000</code> or 15 minutes).</dd>

  <dt><code>extensions.shopping-testpilot@mozilla.org.iframeTimeout</code></dt>
  <dd>Preference type: integer. Delay before removing iframes created during price checks in milliseconds (default: <code>60000</code>or 1 minute).</dd>

  <dt><code>extensions.shopping-testpilot@mozilla.org.alertPercentThreshold</code></dt>
  <dd>Preference type: integer. The percentage drop in price on which to trigger a price alert compared to the last high price (See `price_last_high` in [METRICS.md](./docs/METRICS.md)) default: <code>5</code> or 5%).</dd>

  <dt><code>extensions.shopping-testpilot@mozilla.org.alertAbsoluteThreshold</code></dt>
  <dd>Preference type: integer. The absolute drop in price on which to trigger a price alert compared to the last high price (see `price_last_high` in [METRICS.md](./docs/METRICS.md)) in cents (default: <code>1000</code> or $10).</dd>
</dl>

### Test Page

The extension can be tested with this [Fake Product Page](http://www.mkelly.me/fake-product-page/), which randomly generates a price each time it loads.

Query strings may be used to:
* Set the max price: e.g.  http://www.mkelly.me/fake-product-page/?max=10000
* Fix the price to a particular value: e.g. http://www.mkelly.me/fake-product-page/?dollars=10000


## Releasing a New Version

Price Wise bumps the major version number for every release, similar to Firefox. Releases are created by tagging a commit that bumps the version number and pushing that tag to the repo. This triggers CircleCI automation that packages, tests, and uploads the new version to the Test Pilot S3 bucket.

It is strongly recommended that developers creating releases [configure Git to
sign their commits and tags][signing].

To create a new release of Price Wise:

1. Increment the version number in `package.json`, create a new commit on the `master` branch with this change, and create a new git tag pointing to the commit with a name of the form `v1.0.0`, where `1.0.0` is the new version number.

   `npm` ships with a command that can perform these steps for you automatically:

   ```sh
   npm version major
   ```
2. Push the updated `master` branch and the new tag to the remote for the Mozilla Price Wise repository (named `origin` in the example below):

   ```sh
   git push origin master
   git push origin v1.0.0
   ```

You can follow along with the build and upload progress for the new release on the [CircleCI dashboard][]. Once the build finishes, the new version should be available immediately at https://testpilot.firefox.com/files/shopping-testpilot@mozilla.org/latest.

[signing]: https://help.github.com/articles/signing-commits/
[CircleCI dashboard]: https://circleci.com/dashboard


## License

The Commerce WebExtension is licensed under the MPL v2.0. See [`LICENSE`](LICENSE) for details.
