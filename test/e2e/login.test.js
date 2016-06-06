var initialize = require('../helpers/initialize.helper.test');

var email = 'guest.match@monoapps.co';
var passphrase = 'demo#2015';

describe('home', function () {

  it('should allow login', function () {

    initialize(browser);

    element(by.model('user.email')).sendKeys(email);
    element(by.model('user.password')).sendKeys(passphrase);
    element(by.css('[ng-click="login()"]')).click();

    var resourceList = element.all(by.binding('rname'));
    expect(resourceList.count()).toEqual(4);

  });

});
