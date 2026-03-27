const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--mode=production');

// Shared configuration
const sharedConfig = {
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
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: !isProduction
    })
  ],
  resolve: {
    extensions: ['.ts', '.js']
  }
};

// UMD build (for browsers, CDNs, and legacy bundlers)
const umdConfig = {
  ...sharedConfig,
  name: 'umd',
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isProduction ? 'SVGnet.min.js' : 'SVGnet.js',
    library: {
      name: 'SVGNet',
      type: 'umd',
      export: 'default'
    },
    globalObject: 'this'
  },
  module: {
    rules: [
      ...sharedConfig.module.rules,
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
    ...sharedConfig.plugins,
    ...(isProduction ? [
      new MiniCssExtractPlugin({
        filename: 'SVGnet.css'
      })
    ] : [])
  ]
};

// ESM build (for modern bundlers with tree-shaking)
const esmConfig = {
  ...sharedConfig,
  name: 'esm',
  entry: './src/index.ts',
  experiments: {
    outputModule: true
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'SVGnet.esm.js',
    library: {
      type: 'module'
    },
    clean: false // Don't clean - UMD build already did
  },
  module: {
    rules: [
      ...sharedConfig.module.rules,
      {
        test: /\.css$/,
        use: 'null-loader' // Ignore CSS in ESM build (handled by UMD)
      }
    ]
  },
  externalsType: 'module'
};

// CommonJS build (for Node.js require())
const cjsConfig = {
  ...sharedConfig,
  name: 'cjs',
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'SVGnet.cjs',
    library: {
      type: 'commonjs2'
    },
    clean: false // Don't clean - UMD build already did
  },
  module: {
    rules: [
      ...sharedConfig.module.rules,
      {
        test: /\.css$/,
        use: 'null-loader' // Ignore CSS in CJS build (handled by UMD)
      }
    ]
  },
  target: 'node'
};

// Development server configuration (UMD only)
if (!isProduction) {
  umdConfig.devServer = {
    static: {
      directory: path.join(__dirname, 'docs'),
    },
    port: 8080,
    open: true,
    hot: true
  };

  // Only export UMD config in development
  module.exports = umdConfig;
} else {
  // Export all configs in production
  module.exports = [umdConfig, esmConfig, cjsConfig];
}
