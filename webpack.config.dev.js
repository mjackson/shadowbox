module.exports = {
  entry: {
    'simple-photo': [
      'webpack/hot/dev-server',
      './examples/simple-photo.js'
    ]
  },
  output: {
    path: './examples/scripts',
    filename: '[name].js',
    publicPath: '/examples/scripts/'
  },
  module: {
    loaders: [{
      test: /\.js?/,
      exclude: /node_modules/, 
      loaders: ['babel-loader']
    }]
  }
};