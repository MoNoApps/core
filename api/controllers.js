// references
// NOTE: Planks resources will be override with base definition.
//       Prevents security error injection on base app.
var CBase  = require('../helpers/base').CBase;
var models = require('../helpers/models');
var resources = require('../config.json').resources;
var planks = require('../config.json').planks;
var pconf = require('../config.json').APIVARS.PLANKS;
var planksDir = __dirname.replace('/api', pconf.DIR);

for(var idx in planks){
  if(planks.hasOwnProperty(idx)){
    var name = planks[idx];
    var prefix = '/' + name;
    var plank = require(planksDir + prefix + pconf.MAIN);
    var _cfg_ = require(planksDir + prefix + pconf.CONFIG);

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
