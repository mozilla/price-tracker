# Commerce WebExtension

This repo contains the WebExtension for the Commerce project.

## Developer Setup

Prerequisites:

- A recent version of Node.js and NPM

1. Clone the repository:

   ```sh
   git clone https://github.com/mozilla/webext-commerce.git
   cd webext-commerce
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
   npm config set webext-commerce:firefox_bin <PATH_TO_FIREFOX_BINARY>
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

## License

The Commerce WebExtension is licensed under the MPL v2.0. See `LICENSE` for details.
