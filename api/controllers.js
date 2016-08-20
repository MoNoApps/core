const CBase = require('../helpers/base');
const models = require('../helpers/models');
const resources = require('../config.json').resources;
const plugins = require('../config.json').plugins;
const pconf = require('../config.json').APIVARS.PLUGINS;
const pluginsDir = __dirname.replace('/api', pconf.DIR);

function defineModels(resourceNames = {}) {
  for (let name of Object.keys(resourceNames)) {
    module.exports[name] = new CBase(models[name]);
  }
}

function defineModelsFromPlugins() {
  for (let pluginName of plugins) {
    const pluginConfig = require(`${pluginsDir}/${pluginName}${pconf.CONFIG}`);
    defineModels(pluginConfig.resources);
  }
}

defineModelsFromPlugins();
defineModels(resources);