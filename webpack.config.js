/* eslint-env node */
const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const BUILD_DIR = path.resolve(__dirname, 'build');

// FIXME(osmose): This file is optimized for development. At some point we
// should add optimizations for production-ready code bundling.
module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  target: 'web',
  entry: {
    background: './src/background.js',
  },
  output: {
    path: BUILD_DIR,
    filename: '[name].bundle.js',
  },
  plugins: [
    new CopyWebpackPlugin([
      {from: 'src/icon.svg', to: BUILD_DIR},
      {from: 'src/sidebar.html', to: BUILD_DIR},
      {from: 'src/background.js', to: BUILD_DIR},
      {from: 'src/manifest.json', to: BUILD_DIR},
    ]),
  ],
};
