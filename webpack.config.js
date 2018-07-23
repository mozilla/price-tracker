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
    background: './src/background',
    sidebar: './src/sidebar/index',
    product_info: './src/product_info',
  },
  output: {
    path: BUILD_DIR,
    filename: '[name].bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.jsx$/,
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
    ],
  },
  plugins: [
    new CopyWebpackPlugin([
      // Static files
      {from: '**/*.svg'},
      {from: '**/*.html'},
      {from: 'manifest.json'},
    ], {context: 'src/'}),
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      commerce: path.resolve(__dirname, 'src'),
    },
  },
};
