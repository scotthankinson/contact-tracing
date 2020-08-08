const path = require('path');
const slsw = require('serverless-webpack');
const TerserPlugin = require('terser-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: slsw.lib.webpack.isLocal ? 'production' : 'production',
  entry: slsw.lib.entries,
  devtool: 'source-map',
  plugins: [
    new webpack.BannerPlugin({
      banner: 'require("source-map-support").install();',
      raw: true,
      entryOnly: false
    }),
    new CopyPlugin({
      patterns: [
        'mappings/**'
      ]
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    plugins: [new TsconfigPathsPlugin({ configFile: path.join(__dirname, "tsconfig.json") }),]
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js',
    sourceMapFilename: '[file].map'
  },
  target: 'node',
  optimization: {
    minimizer: [
      new TerserPlugin({ test: /\.js(\?.*)?$/i, sourceMap: true })
    ],
  },
  externals: [nodeExternals({ whitelist: ['source-map-support'] })],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loaders: 'ts-loader',
        exclude: [/node_modules/]
      },
    ],
  },
};