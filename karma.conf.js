module.exports = function(config) {
  config.set({

    basePath: '',

    frameworks: ['mocha', 'chai'],

    files: [
      'lib/__tests__/phantom.js',
      'node_modules/sinon/pkg/sinon.js',
      'lib/**/__tests__/*.spec.js'
    ],

    exclude: [],

    preprocessors: {
      'lib/**/__tests__/*.spec.js': ['webpack']
    },

    reporters: ['spec'],

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: false,

    browsers: ['PhantomJS'],

    singleRun: true,

    plugins: [
      'karma-mocha',
      'karma-chai',
      'karma-webpack',
      'karma-spec-reporter',
      'karma-chrome-launcher',
      'karma-phantomjs-launcher'
    ],

    webpack: {
      module: {
        loaders: [{
          test: /\.js/,
          exclude: /node_modules/,
          loaders: ['babel-loader']
        }]
      }
    },

    webpackMiddleware: {
      noInfo: true
    }

  });
};
