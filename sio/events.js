var db = require('../helpers/models');
var shuffle = require('../helpers/utils').shuffle;
var review = require('../helpers/manager').review;

var users = function(socket, cb) {
  review(
    { req:
      {params: {token: socket.token} },
      res: {}
    }, function(err, opt) {
      db.users.Find({}, function(err, rsp){
        cb(err, rsp);
      },
      {email: 1, diamonds: 1}
    );
  });
};

var levels = function(socket, cb){
  review({ req: {params: {token: socket.token} }, res: {} }, function(err, opt){
    db.levels.Find({}, function(err, rsp){
      cb(err, rsp);
    });
  });
};

var current = function(socket, cb){
  review({ req: {params: {token: socket.token} }, res: {} }, function(err, opt){
    db.levels.FindOne({}, function(err, rsp){
      rsp.board = shuffle(rsp.board);
      cb(err, rsp);
    });
  });
};

var challenges = function(socket, cb){
  db.challenges.Find({}, function(err, rsp){
    cb(err, rsp);
  });
};

var changes = function(opts){
  opts.socket.join(opts.name);

  var msg = {name: opts.name};
  msg.size = opts.sio.of(opts.name).server.eio.clientsCount;
  opts.socket.broadcast.to('match').emit('join', msg);
};

module.exports.users = users;
module.exports.levels = levels;
module.exports.current = current;
module.exports.changes = changes;
module.exports.challenges = challenges;
