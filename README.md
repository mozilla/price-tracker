# Price Wise

Price Wise is a Firefox extension that tracks price changes to help you find the best time to buy.

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

## Running Tests

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

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Launch Firefox with the extension temporarily installed |
| `npm run lint` | Run linting checks |
| `npm run build` | Compile source files with Webpack |
| `npm run watch` | Watch for changes and rebuild |
| `npm run package` | Package the extension into an XPI file |
| `pipenv run test` | Run test suite (See "Running Tests" for setup) |

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

## Code Organization

- `src/background` contains the background scripts that trigger UI elements (such as the page action) and periodically check for price updates.
- `src/browser_action` contains the toolbar popup for managing the list of currently-tracked products and tracking new products.
- `src/extraction` contains the content scripts that extract product information from product web pages.
- `src/state` contains the Redux-based code for managing global extension state.
- `src/tests` contains the automated test suite.

### Data Storage

Global state for the add-on is managed via [Redux][]. Any time the data is changed, it is persisted to the [add-on local storage][localstorage].

Reducers, action creators, etc. are organized into [ducks][] inside the `src/state` directory.

[Redux]: https://redux.js.org/
[localstorage]: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/local
[ducks]: https://github.com/erikras/ducks-modular-redux

## License

The Commerce WebExtension is licensed under the MPL v2.0. See `LICENSE` for details.
