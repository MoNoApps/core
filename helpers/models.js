// packages
var MPill = require('mpill').MPill;

// vars
var dburl     = require("../config.json").dburl;
var resources = require("../config.json").resources;
var planks = require('../config.json').planks;
var pconf = require('../config.json').APIVARS.PLANKS;
var planksDir = __dirname.replace('/helpers', pconf.DIR);

for(var idx in planks){
  if(planks.hasOwnProperty(idx)){
    var name = planks[idx];
    var prefix = '/' + name;
    var _cfg_ = require(planksDir + prefix + pconf.CONFIG);

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
