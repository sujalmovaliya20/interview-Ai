const path = require('path')

module.exports = {
  entry: './src/main.ts',
  target: 'electron-main',
  output: {
    filename: 'index.js',
    libraryTarget: 'commonjs2'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.json'),
            transpileOnly: true
          }
        }
      }
    ]
  },
  externals: {
    'electron': 'commonjs electron',
    'socket.io-client': 'commonjs socket.io-client',
    'engine.io-client': 'commonjs engine.io-client',
    'ws': 'commonjs ws',
    'bufferutil': 'commonjs bufferutil',
    'utf-8-validate': 'commonjs utf-8-validate',
    'fsevents': 'commonjs fsevents'
  },
  node: {
    __dirname: false,
    __filename: false
  }
}
