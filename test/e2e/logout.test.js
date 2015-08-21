var initialize = require('../helpers/initialize.helper.test');
var dropuser = require('../helpers/dropuser.helper.test');

describe('logout', function() {
  it('should destroy session', function() {
    initialize(browser);
    element( by.css('[ng-click="logout()"]') ).click();
  });
});
