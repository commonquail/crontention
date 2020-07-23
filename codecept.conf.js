const { setHeadlessWhen } = require('@codeceptjs/configure');

setHeadlessWhen(process.env.HEADLESS);

exports.config = {
  tests: './acceptance/test/*.test.ts',
  output: './acceptance/output',
  helpers: {
    Puppeteer: {
      url: 'http://localhost:8080',
      show: true,
      windowSize: '1200x900'
    }
  },
  include: {
    I: './acceptance/typings/steps_file.js',
    about: "./acceptance/page/about.page.ts",
    home: "./acceptance/page/home.page.ts",
  },
  bootstrap: null,
  mocha: {},
  name: 'crontention',
  plugins: {
    retryFailedStep: {
      enabled: true
    },
    screenshotOnFail: {
      enabled: true
    }
  },
  require: [
    "ts-node/register",
  ]
}
