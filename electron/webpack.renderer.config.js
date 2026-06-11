const path = require('path')

module.exports = {
  // Target for renderer process
  target: 'web',

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  },

  module: {
    rules: [
      // TypeScript
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
      },
      // CSS
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      // Images/fonts
      {
        test: /\.(png|jpg|gif|svg|ico|woff|woff2|eot|ttf)$/,
        type: 'asset/resource'
      }
    ]
  }
}
