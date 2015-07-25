var views = require('../../config.json').views;
var utils = require('../../helpers/utils');
var models = require('../../helpers/models');
var initialize = require('../helpers/initialize.helper.test');
var adduser = require('../helpers/adduser.helper.test');

var passphrase;
var testUser = {
  email: 'tester@monoapps.co',
  status: 1,
  date: new Date().getTime()
};

describe('home', function(){

  beforeEach(function(done){
    adduser(testUser, function(err, text){
      passphrase = text;
      done();
    });
  });

  it('should allow login', function() {
    initialize(browser);

    element(by.model('user.email')).sendKeys(testUser.email);
    element(by.model('user.password')).sendKeys(passphrase);
    element(by.css('[ng-click="login()"]')).click();

    var resourceList = element.all(by.binding('rname'));
    expect(resourceList.count()).toEqual(4);

    views.forEach(function(r,i) {
      resourceList.get(i).getInnerHtml().then(function(a,b) {
        expect(a.toLowerCase()).toEqual(r);
      });
    });
  });

});
