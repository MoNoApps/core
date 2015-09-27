// references
// NOTE: Plugins resources will be override with base definition.
//       Prevents security error injection on base app.
var CBase  = require('../helpers/base').CBase;
var models = require('../helpers/models');
var resources = require('../config.json').resources;
var plugins = require('../config.json').plugins;
var pconf = require('../config.json').APIVARS.PLUGINS;
var pluginsDir = __dirname.replace('/api', pconf.DIR);

for(var idx in plugins){
  if(plugins.hasOwnProperty(idx)){
    var name = plugins[idx];
    var prefix = '/' + name;
    //var plugin = require(pluginsDir + prefix + pconf.MAIN);
    var _cfg_ = require(pluginsDir + prefix + pconf.CONFIG);

    for(var g in _cfg_.resources){
      if(_cfg_.resources.hasOwnProperty(g)){
        module.exports[g] = new CBase(models[g]);
      }
    }
  }
}

for(var c in resources){
  if(resources.hasOwnProperty(c)){
    module.exports[c] = new CBase(models[c]);
  }
}
