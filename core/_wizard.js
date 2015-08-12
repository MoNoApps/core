var f = require('fs');
var _ = require('underscore');
var u = require('util').log;
var r = {};
var cr = require('../config.json').resources;
var k = require('../config.json').planks;
var b = require('../config.json').APIVARS.PLANKS;
var n = __dirname.replace('/core', b.DIR);
var w = ['tokens', 'settings'];
var s = ['actions', 'login', 'recover', 'register' ];
var p = './views/index/forms';


var c = function (n) {
  return n.replace('.jade','');
};

var j = function (props) {
  for (var p in props) {
    if(props.hasOwnProperty(p)){
      if(!props[p].exclude){
        r[p] = props[p];
      }
    }
  }
};

var init = function() {
  for(var i in k){
    if(k.hasOwnProperty(i)){
      var e = k[i];
      var g = '/' + e;
      var a = require(n + g + b.CONFIG);

      j(a.resources);
    }
  }
};

init();
j(r);

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

  cb({models: m, valid: x, missing: v, resources: r});
};
