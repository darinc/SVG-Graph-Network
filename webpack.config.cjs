const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--mode=production');

const config = {
  entry: {
    'svg-graph-network': './src/index.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isProduction ? '[name].min.js' : '[name].js',
    library: {
      name: 'SVGGraphNetwork',
      type: 'umd',
      export: 'default'
    },
    globalObject: 'this',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader'
        ]
      }
    ]
  },
  plugins: [
    ...(isProduction ? [
      new MiniCssExtractPlugin({
        filename: 'svg-graph-network.css'
      })
    ] : [])
  ],
  resolve: {
    extensions: ['.ts', '.js']
  }
};

// Development server configuration
if (!isProduction) {
  config.devServer = {
    static: {
      directory: path.join(__dirname, 'docs'),
    },
    port: 8080,
    open: true,
    hot: true
  };
}

module.exports = config;