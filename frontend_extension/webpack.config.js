const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const fs = require('fs');

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '.env');
const envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
}

module.exports = {
  mode: 'production',
  entry: {
    popup: './extension/popup/popup.tsx',
    background: './extension/background/index.ts',
    content: './extension/content/index.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist/extension'),
    filename: '[name]/index.js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
    fallback: {
      "crypto": false,
      "stream": false,
      "buffer": false,
      "process": false,
      "path": false,
      "fs": false,
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.extension.json',
            transpileOnly: true,
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.NEXT_PUBLIC_SUI_NETWORK': JSON.stringify(envVars.NEXT_PUBLIC_SUI_NETWORK || 'testnet'),
      'process.env.NEXT_PUBLIC_SUI_RPC_URL': JSON.stringify(envVars.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443'),
      'process.env.NEXT_PUBLIC_VAULT_PACKAGE_ID': JSON.stringify(envVars.NEXT_PUBLIC_VAULT_PACKAGE_ID || '0x6d30e6996ab01fd91d80babc05d316800cff3a8c2d54d96452e6f75d4b127276'),
      'process.env.NEXT_PUBLIC_PASSWORD_ENTRY_PACKAGE_ID': JSON.stringify(envVars.NEXT_PUBLIC_PASSWORD_ENTRY_PACKAGE_ID || '0xe80066a36391fd616a4f872a968a0fbe0b540637ec16ee084565c5a08d3ad4dd'),
      'process.env.NEXT_PUBLIC_ALERT_PACKAGE_ID': JSON.stringify(envVars.NEXT_PUBLIC_ALERT_PACKAGE_ID || '0x1b5f1d409bbc4377fc98d2218a91419d473b737782a04f52aac084a1803bfe4f'),
      'process.env.NEXT_PUBLIC_ACCESS_CONTROL_PACKAGE_ID': JSON.stringify(envVars.NEXT_PUBLIC_ACCESS_CONTROL_PACKAGE_ID || '0x6d30e6996ab01fd91d80babc05d316800cff3a8c2d54d96452e6f75d4b127276'),
      'process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL': JSON.stringify(envVars.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space'),
      'process.env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL': JSON.stringify(envVars.NEXT_PUBLIC_WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space'),
      'process.env.NEXT_PUBLIC_BACKEND_URL': JSON.stringify(envVars.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'),
      'process.env.NEXT_PUBLIC_WEBSOCKET_URL': JSON.stringify(envVars.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3002'),
      'process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID': JSON.stringify(envVars.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'your_google_client_id_here'),
      'process.env.NEXT_PUBLIC_REDIRECT_URL': JSON.stringify(envVars.NEXT_PUBLIC_REDIRECT_URL || 'http://localhost:3000/auth/callback'),
      'process': false,
    }),
    new HtmlWebpackPlugin({
      template: './extension/popup/index.html',
      filename: 'popup/index.html',
      chunks: ['popup'],
    }),
    new CopyPlugin({
      patterns: [
        { 
          from: 'extension/manifest.json', 
          to: 'manifest.json',
          transform(content) {
            // Update manifest with correct paths and remove missing CSS
            const manifest = JSON.parse(content.toString());
            manifest.action.default_popup = 'popup/index.html';
            manifest.background.service_worker = 'background/index.js';
            manifest.content_scripts[0].js = ['content/index.js'];
            // Remove CSS reference since we don't have the file
            delete manifest.content_scripts[0].css;
            // Remove icon references since we don't have the files
            delete manifest.icons;
            delete manifest.action.default_icon;
            return JSON.stringify(manifest, null, 2);
          }
        },
        { 
          from: 'extension/assets', 
          to: 'assets',
          noErrorOnMissing: true,
        },
        {
          from: 'extension/popup/popup.css',
          to: 'popup/popup.css',
        },
        {
          from: 'extension/content/styles.css',
          to: 'content/styles.css',
          noErrorOnMissing: true,
        },
      ],
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
};