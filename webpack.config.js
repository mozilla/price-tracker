/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Webpack configuration for building the webextension.
 */

/* eslint-env node */

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const BUILD_DIR = path.resolve(__dirname, 'build');

// FIXME(osmose): This file is optimized for development. At some point we
// should add optimizations for production-ready code bundling.
module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  target: 'web',
  entry: {
    background: './src/background/index',
    product_info: './src/product_info',
    browser_action: './src/browser_action/index',
  },
  output: {
    path: BUILD_DIR,
    filename: '[name].bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: [
          {loader: 'style-loader'},
          {loader: 'css-loader'},
        ],
      },
      // jsdom is imported by fathom-web utils.js; it's only used for testing
      {
        test: /jsdom.*/,
        use: {
          loader: 'null-loader',
        },
      },
    ],
  },
  node: {
    fs: 'empty',
  },
  plugins: [
    new CopyWebpackPlugin([
      // Static files
      {from: '**/*.svg'},
      {from: '**/*.html'},
      {from: 'manifest.json'},

      // First run page doesn't use JS so it can't bundle CSS
      {from: 'first_run/*.css'},
    ], {context: 'src/'}),
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      commerce: path.resolve(__dirname, 'src'),
    },
  },
};
