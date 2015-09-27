var f = require('fs');
var _ = require('underscore');
var r = {};
var cr = require('../config.json').resources;
var k = require('../config.json').plugins;
var b = require('../config.json').APIVARS.PLUGINS;
var n = __dirname.replace('/autoform', b.DIR);
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

var generator = function (cb) {
  var t;
  var x;
  var v;
  var u = _.union(Object.keys(r), Object.keys(cr));
  var m = _.difference(u, w);

  for(var idx in r) {
    if (r.hasOwnProperty(idx)) {
      rc[idx] = r[idx];
    }
  }

  if(f.existsSync(p)){
    t = f.readdirSync(p);
    t = _.map(t, c);
    t = _.difference(t,s);
    x = _.intersection(m,t);
    v = _.difference(m,t);
  }

  cb({
    models: m,
    valid: x,
    missing: v,
    resources: u,
    schemas: cr
  });
};

module.exports = generator;
