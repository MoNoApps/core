var db = require('../helpers/models');
var review = require('../helpers/manager').review;

function users(socket, cb) {
  review(
    {req: {params: {token: socket.token} }, res: {} }, 
    ((err, opt) => db.users.Find({}, ((err, rsp) =>  cb(err, rsp))))
  );
}

function roles(socket, cb) {
  db.roles.Find({}, ((err, rsp) => cb(err, rsp)));
}

module.exports.users = users;
module.exports.roles = roles;
