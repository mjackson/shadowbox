module.exports = {
  entry: './lib/shadowbox.js',
  output: {
    path: './dist',
    filename: 'shadowbox.js',
    library: 'Shadowbox',
    libraryTarget: 'var'
  },
  module: {
    loaders: [{
      test: /\.js?/,
      exclude: /node_modules/, 
      loaders: ['babel-loader']
    }]
  }
};