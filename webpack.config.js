const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  entry: {
    "kin-sdk": __dirname + "/scripts/src/index.ts"
  },
  target: 'web',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true
          }
        },
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  output: {
    filename: "./[name].js",
    library: 'KinSdk',
    globalObject: 'typeof self !== \'undefined\' ? self : this',
    path: path.resolve(__dirname, "public")
  },
  plugins: [
    // new CompressionPlugin(),
    new HtmlWebpackPlugin({
      template: './public/template.html',
      filename: './index.html',
      inject: 'head'
    })
  ],
};
