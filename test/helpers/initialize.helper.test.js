var base = require('../../config.json').URL.BASE;

module.exports = function (browser, path) {
  browser.get(base + (path || ''));
  browser.manage().window().maximize();
  browser.waitForAngular();
};
