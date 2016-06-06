var initialize = require('../helpers/initialize.helper.test');

describe('bad login credentials', function () {
  it('should return 401', function () {
    initialize(browser);
    element(by.model('user.email')).sendKeys('unauthorized@monoapps.co');
    element(by.model('user.password')).sendKeys('unauthorized');
    element(by.css('[ng-click="login()"]')).click();
    expect(element(by.binding('error')).getInnerHtml()).toEqual('Unauthorized');
  });
});
