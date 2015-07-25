var resources = require('../../config.json').resources;
var utils = require('../../helpers/utils');
var models = require('../../helpers/models');

module.exports = function(testUser, cb){

  models.users.Insert(testUser, function(err, users) {
    if(err) { process.exit(); }

    users = (users.ops ? users.ops : users); //db v3|v2
    expect(err).toBe(null);
    expect(users.length).toBe(1);

    var user = users[0];
    var options = {
      key: user._id.toString(),
      text: testUser.text || utils.createUUID()
    };

    utils.createPwd(options, function(pwd, passphrase) {
      expect(pwd.type).toEqual(jasmine.any(String));
      expect(pwd.value).toEqual(jasmine.any(String));
      expect(passphrase).toEqual(jasmine.any(String));

      var query = {'_id': options.key};
      user.password = pwd;
      models.users.UpdateByObjectId(query, user, '_id', function(err, ack) {
        expect(err).toBe(null);
        expect(ack.result.nModified).toBe(1);
        cb(err, passphrase);
      });
    });
  });

};
