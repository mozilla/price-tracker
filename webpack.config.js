/* eslint-env node */
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const BUILD_DIR = path.resolve(__dirname, 'build');
const SOURCE_DIR = path.resolve(__dirname, 'src');

// FIXME(osmose): This file is optimized for development. At some point we
// should add optimizations for production-ready code bundling.
module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  target: 'web',
  entry: {
    background: './src/background.js',
    sidebar: './src/sidebar.jsx',
  },
  output: {
    path: BUILD_DIR,
    filename: '[name].bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.jsx$/,
        include: SOURCE_DIR,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin([
      {from: 'product_info.js'},

      // Static files
      {from: '**/*.svg'},
      {from: '**/*.html'},
      {from: '**/*.json'},
    ], {context: 'src/'}),
  ],
};
