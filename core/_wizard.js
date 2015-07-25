var f = require('fs');
var _ = require('underscore');
var u = require('util').log;
var r = require('../config.json').resources;
var w = ['tokens', 'settings'];
var s = ['actions', 'login', 'recover', 'register' ];
var p = './views/index/forms';

var c = function (n) { 
  return n.replace('.jade',''); 
};

module.exports = function (cb) {
  var t;
  var x;
  var v;
  var m = _.difference(Object.keys(r), w);

  if(f.existsSync(p)){
    t = f.readdirSync(p);
    t = _.map(t, c);
    t = _.difference(t,s);
    x = _.intersection(m,t);
    v = _.difference(m,t);
  }

  cb({models: m, valid: x, missing: v});
};
