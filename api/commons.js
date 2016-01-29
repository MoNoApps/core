// references
var config = require('../config.json');
var utils = require('../helpers/utils');
var register = require("./register");
var models = require('../helpers/models');
var controllers = require('./controllers');
var review = require('../helpers/manager').review;
var manager = require('../helpers/manager').response;
var sendM  = require('../helpers/email').sendMail;

var ping = function(req, res){
  res.send(200);
};

var login = function(req, res){
  if(!req.body){ return res.send(401); }
  register.isPwdOK(req.body.email, req.body.password, function(err, token, isOK){
    if(isOK){
      if(token.ops){
        res.send(200 , {token: token.ops[0]._id});
      }else{
        res.send(200 , {token: token[0]._id});
      }

    }else{
      res.send(401);
    }
  });
};

var signup = function(req, res){
  register.addUser(req.params.email, function(err, success){
    if(err){ return res.send(401, err); }
    res.send(200, success);
  });
};

var confirm = function(req, res){
  register.confirmEmail(req.params.code, function(err){
    if(err){ return res.send(401, {message: err}); }
    res.header('Location', '/registered');
    res.send(302, {message: 'User Confirmed'});
  });
};

var theme = function(req, res){
  res.json({theme: config.theme});
};

var properties = function(req, res){
  review({ req: req, res: res }, function(err, opt){
    controllers.settings.GetOne({"type": "properties"}, function(err, rsp){
      if(err){ return res.status(501); }
      if(!opt.user.admin){
        rsp.data.resources = rsp.data.user;
      }else{
        rsp.data.resources = rsp.data.admin;
      }
      delete rsp.data.user;
      delete rsp.data.admin;
      manager({req: req, res: res, err: err, rsp: rsp.data});
    });
  });
};

//NOTE: don't handle errors
var recover = function(req, res){
  var email = req.params.email;

  _markUser(email, function(err, key){
    sendM({
      html:
'<div>' +
'<h1>Recover password request</h1>' +
'<p>We have received a request from ' + config.site + '. In case you have not requested recovery password you can ignore this email.<p>' +
'<p>' +
  'Open link ' +
  '<a href="' + config.URL.BASE + config.URL.REC + key + '">Recover Password</a>' +
  ' or use this one ' + config.URL.BASE + config.URL.REC + key +
'</p>' +
'</div>',
      text: 'Recover',
      subject: 'Recovery Password Request - ' + config.site + '',
      email: email,
      name: email,
      tags: ['recover']
    }, function(){});
  });

  res.send(200);
};

var _markUser = function(email, cb){
  var key = utils.createUUID();
  controllers.users.Update(
    {email: email},
    {$set: {recover: key}},
    function(err, results){
      cb(err, key);
    }
  );
};

//NOTE: don't handle errors
var rescue = function(req, res){
  models.users.FindOne({recover: req.params.code}, function(err, user){
    if(err){ } // do nothing
    if(user){
      utils.createPwd({key: user._id.toString(), text: utils.createUUID()}, function(pwd, text){
        user.password = pwd;
        delete user.recover;
        user.updatedAt = new Date().getTime();

        models.users.UpdateByObjectId({'_id': user._id.toString()}, user, '_id', function(err, ack){
          if(err){ } // do nothing
          if(ack){
            sendM({
              html:
'<div>' +
  '<h1>Password Changed</h1>' +
  '<p>' +
    'Password has been changed to: ' +
  '</p>' +
  '<p>' + text + '</p>' +
'</div>',
              text: 'Password Changed',
              subject: 'Password Changed - ' + config.site + '',
              email: user.email,
              name: user.email,
              tags: ['chgpwd']
            }, function(err){
              if(err){ } // do nothing
            });
          }
        });
      });
    }
  });

  res.header('Location', '/recover');
  res.send(302, { site: config.site });
};

module.exports.ping = ping;
module.exports.login = login;
module.exports.theme = theme;
module.exports.signup = signup;
module.exports.rescue = rescue;
module.exports.confirm = confirm;
module.exports.recover = recover;
module.exports.properties = properties;

