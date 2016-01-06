var utils = require('../helpers/utils');
var guest = require('../config.json').guest;
var controllers = require('./controllers');
var review = require('../helpers/manager').review;
var manager = require('../helpers/manager').response;

var find = function(req, res){
  review({ req: req, res: res }, function(err, opt){
    var rsp = opt.user;
    delete rsp.password;
    manager({req: req, res: res, err: err, rsp: rsp});
  });
};

var update = function(req, res){
  review({ req: req, res: res }, function(err, opt){
    var restricted = _guest({ req: req, res: res, email: opt.user.email });
    if(restricted) { return manager(restricted); }
    controllers.users.UpdateById(opt.user._id.toString(), {$set: {name: req.body.name} }, function(err, rsp){
      manager({req: req, res: res, err: err, rsp: rsp});
    });
  });
};

var security = function(req, res){
  review({ req: req, res: res }, function(err, opt){

    var restricted = _guest({ req: req, res: res, email: opt.user.email });
    if(restricted) { return manager(restricted); }

    if(!req.body.password || !req.body.newPwd || !req.body.again || (req.body.newPwd !== req.body.again)){
      return res.send(401);
    }

    var query = {key: opt.user._id.toString(), text: req.body.password};
    utils.comparePwd(query, opt.user.password, function(isOK){
      if(isOK){
        query.text = req.body.newPwd;
        utils.createPwd(query, function(pwd){
          controllers.users.UpdateById(opt.user._id.toString(), {$set: {password: pwd} }, function(err, rsp){
            manager({req: req, res: res, err: err, rsp: rsp});
          });
        });
      }else{
        return res.send(401);
      }
    });
  });
};

var guestInfo = function(req, res) {
  if (guest.enabled) {
    var user = {email: guest.email, password: guest.text};
    res.json(user);
  } else {
   res.json({}); 
  }
};

var _guest = function(data) {
  if (data.email===guest.email) {
    data.err = false;
    data.rsp = {message: 'Update is disabled'};
    return data;
  }

  return false;
};

module.exports.find = find;
module.exports.guest = guestInfo;
module.exports.update = update;
module.exports.security = security;

