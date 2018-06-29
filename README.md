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

## NPM Scripts

| Command | Description |
| --- | --- |
| `npm start` | Launch Firefox with the extension temporarily installed |
| `npm run lint` | Run linting checks |
| `npm run build` | Compile source files with Webpack |
| `npm run watch` | Watch for changes and rebuild |
| `npm run package` | Package the extension into an XPI file |

## License

The Commerce WebExtension is licensed under the MPL v2.0. See `LICENSE` for details.
