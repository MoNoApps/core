exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  specs: [
    './test/e2e/noauth.test.js',
    './test/e2e/login.test.js',
    './test/e2e/account.test.js',
    './test/e2e/resources.test.js',
    './test/e2e/theme.test.js',
    './test/e2e/pages.test.js',
    './test/e2e/logout.test.js'
  ],
  multiCapabilities: [
    { browserName: 'ie' },
    { browserName: 'firefox' },
    { browserName: 'chrome'}
  ]
};
