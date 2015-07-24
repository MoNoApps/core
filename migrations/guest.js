var resources = require('../config.json').resources;
var models = require('../helpers/models');
var utils = require('../helpers/utils');
var adduser = require('../test/helpers/adduser.helper.test');

var testUser = {
  email: 'guest.match@monoapps.co',
  status: 1,
  date: new Date().getTime()
};

models.users.Insert(testUser, function(err, users) {
  if(err) { process.exit(); }
  users = (users.ops ? users.ops : users); //db v3|v2
  var user = users[0];
  var options = {
    key: user._id.toString(),
    text: 'demo#2015'
  };

  utils.createPwd(options, function(pwd, passphrase) {
    var query = {'_id': options.key};
    user.password = pwd;
    models.users.UpdateByObjectId(query, user, '_id', function() {
      process.exit();
    });
  });
});
