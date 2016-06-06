var initialize = require('../helpers/initialize.helper.test');

describe('themes', function () {

  it('should allow change theme', function () {
    initialize(browser);

    var themeList = element.all(by.repeater('t in themes'));
    expect(themeList.count()).toEqual(16);

    themeList.each(function (e, i) {
      element(by.id('themesLink')).click();
      element(by.id('theme' + i)).click();
    });
  });

});
