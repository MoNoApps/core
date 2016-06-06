var initialize = require('../helpers/initialize.helper.test');

describe('account', function () {

  it('should add username', function () {
    initialize(browser, '/account');
    element(by.model('account.name')).sendKeys('Tester Smille');
    element(by.css('[ng-click="saveAccount()"]')).click();
    expect(element(by.binding('success')).getInnerHtml()).toEqual('Account updated');
  });

  it('should change password', function () {
    //TODO: add test
  });

});
