var config = require('../config.json');
var resources = config.resources;
var models = require('../helpers/models');
var utils = require('../helpers/utils');
var adduser = require('../test/helpers/adduser.helper.test');
var guest = config.guest;
var text = guest.text;

delete guest.text;
delete guest.enabled;
guest.date = new Date().getTime();

models.users.Insert(guest, function (err, users) {
  if (err) { process.exit(); }
  users = (users.ops ? users.ops : users); //db v3|v2
  var user = users[0];
  var options = {
    key: user._id.toString(),
    text: text
  };

  utils.createPwd(options, function (pwd, passphrase) {
    var query = { '_id': options.key };
    user.password = pwd;
    models.users.UpdateByObjectId(query, user, '_id', function () {
      process.exit();
    });
  });
});

