var pages = require('../../config.json').pages;

describe('resources', function () {

  beforeEach(function () {
    browser.ignoreSynchronization = true;
  });

  //hack for pages
  pages.forEach(function (p, i) {
    it('should open ' + p + ' page', function () {
      browser.get(require('../../config.json').URL.BASE + '/' + pages[i]);
      browser.manage().window().maximize();
      browser.getTitle().then(function (text) {
        expect(text).toEqual(jasmine.any(String));
      });
    });
  });

});
