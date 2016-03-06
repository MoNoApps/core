// packages
var MPill = require('mpill').MPill;

// vars
var config = require("../config.json");
var plugins = config.plugins;
var pconf = require('../config.json').APIVARS.PLUGINS;
var pluginsDir = __dirname.replace('/helpers', pconf.DIR);
var models = {};

function addModel(name, dburl) {
  models[name] = new MPill(name, dburl);
}

function resourcesIterator(resources, dburl) {
  for (var name in resources) {
    if (resources.hasOwnProperty(name)) {
      addModel(name, dburl);
    }
  }
}

resourcesIterator(config.resources, config.dburl);

for (var idx in plugins) {
  if (plugins.hasOwnProperty(idx)) {
    var plugin = plugins[idx];
    var prefix = '/' + plugin;
    var _cfg_ = require(pluginsDir + prefix + pconf.CONFIG);

    resourcesIterator(_cfg_.resources, _cfg_.dburl);
  }
}

module.exports = models;

