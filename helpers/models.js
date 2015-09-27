// packages
var MPill = require('mpill').MPill;

// vars
var dburl     = require("../config.json").dburl;
var resources = require("../config.json").resources;
var plugins = require('../config.json').plugins;
var pconf = require('../config.json').APIVARS.PLUGINS;
var pluginsDir = __dirname.replace('/helpers', pconf.DIR);

for(var idx in plugins){
  if(plugins.hasOwnProperty(idx)){
    var name = plugins[idx];
    var prefix = '/' + name;
    var _cfg_ = require(pluginsDir + prefix + pconf.CONFIG);

    for(var g in _cfg_.resources){
      if(_cfg_.resources.hasOwnProperty(g)){
        module.exports[g] = new MPill(g, _cfg_.dburl);
      }
    }
  }
}

//Exports every new collection
for(var c in resources){
  if(resources.hasOwnProperty(c)){
    module.exports[c] = new MPill(c, dburl);
  }
}
