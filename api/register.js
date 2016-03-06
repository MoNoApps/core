var config = require('../config.json');
var models = require('../helpers/models');
var utils  = require('../helpers/utils');
var sendM  = require('../helpers/email').sendMail;
var crypto = require('crypto');

function getGravatarURL(email) {
  var size = 50;
  var hash = crypto.createHash('md5').update(email).digest('hex');
  return 'https://secure.gravatar.com/avatar/' + hash + '.jpg?size=' + size;
}

function addUser(email, cb) {
  models.users.FindOne({email: email}, function(err, user){
    if(err){ return cb('Email Registry Error.'); }
    if(user){ return cb(false); } // No Error if found user

    var code  = utils.createUUID();
    var query = {email: email, code: code};
    models.users.Insert(query, function(err, user ){
      if(err){ return cb('Email Registry Error.'); }

      sendM({
        html:
'<div>' +
  '<h1>Welcome to ' + config.site + '</h1>' +
  '<p>' +
    'Open link ' +
    '<a href="' + config.URL.BASE + config.URL.ACK + code + '">Confirm Email</a>' +
    ' or use this one ' + config.URL.BASE + config.URL.ACK + code +
  '</p>' +
'</div>',
        text: 'Email Confirmation',
        subject: 'Registry - ' + config.site + '',
        email: email,
        name: email,
        tags: ['register']
      }, function(err){
        if(err){ return cb(err); }
        cb(false, 'Email Registered.');
      });
    });
  });
}

function confirmEmail(code, cb) {
  models.users.FindOne({code: code}, function(err, user){
    if(err){ return cb('Email Registry Error.'); }
    if(user){
      utils.createPwd({key: user._id.toString(), text: utils.createUUID()}, function(pwd, text){

        user.password = pwd;
        delete user.code;
        user.status = 1;
        user.date = new Date().getTime();
        user.gravatar = getGravatarURL(user.email);

        models.users.UpdateByObjectId({'_id': user._id.toString()}, user, '_id', function(err, ack){
          if(err){ return cb('User Update Error.'); }
          if(ack){
            sendM({
              html:
'<div>' +
  '<h1>Access Confirm</h1>' +
  '<p>' +
    'First time access, use next password: ' +
  '</p>' +
  '<p>' + text + '</p>' +
'</div>',
              text: 'Access Confirm',
              subject: 'First Time Access - ' + config.site + '',
              email: user.email,
              name: user.email,
              tags: ['autopwd']
            }, function(err){
              if(err){ return cb(err); }
              cb(false, 'Email Registered.');
            });

            return cb(false, user);

          }else{ return cb('Confirmation Not Found.'); }
        });
      });
    }else{
      return cb('User Not Found.');
    }
  });
}

function isPwdOK(email, text, cb) {
  models.users.FindOne({email: email}, function(err, user){
    if(err || !user){
      cb(false);
    }else{
      var options = {key: user._id.toString(), text: text};
      utils.comparePwd(options, user.password, function(isValid){
        if(isValid){
          utils.createToken(user, function(err, token){
            cb(err, isValid, token, user.gravatar);
          });
        }else{
          cb('Invalid Auth', isValid);
        }
      });
    }
  });
}

module.exports.isPwdOK = isPwdOK;
module.exports.addUser = addUser;
module.exports.confirmEmail = confirmEmail;
