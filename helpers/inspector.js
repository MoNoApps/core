var generator = require('../helpers/generator');
var controllers = require('../api/controllers');
var plugins = require('../config.json').plugins;
var pconf = require('../config.json').APIVARS.PLUGINS;
var pluginsDir = __dirname.replace('/helpers', pconf.DIR);

var apiParams = function (defRoute) {
  var defParams = '';

  if(defRoute.params) {
    for(var param in defRoute.params) {
      if (param) { defParams += '/:'+ param; }
    }
  }
  return defParams;
};

var addPluginsApi = function(api){
  for(var idx in plugins){
    if(plugins.hasOwnProperty(idx)){
      var name = plugins[idx];
      var prefix = '/' + name;
      var plugin = require(pluginsDir + prefix + pconf.MAIN);
      var _cfg_ = require(pluginsDir + prefix + pconf.CONFIG);

      for(var g in plugin.api.GET) {
        if (plugin.api.GET.hasOwnProperty(g)) {
          var defGET = plugin.api.GET[g];
          api.get(prefix + '/' + defGET.route + apiParams(defGET), defGET.fn);
        }
      }

      for(var p in plugin.api.POST) {
        if (plugin.api.POST.hasOwnProperty(p)) {
          var defPOST = plugin.api.POST[p];
          api.post(prefix + '/' + defPOST.route + apiParams(defPOST), defPOST.fn);
        }
      }

      for(var d in plugin.api.DELETE) {
        if (plugin.api.DELETE.hasOwnProperty(d)) {
          var defDELETE = plugin.api.DELETE[d];
          api.del(prefix + '/' + defDELETE.route + apiParams(defDELETE), defDELETE.fn);
        }
      }

      for(var t in plugin.api.PUT) {
        if (plugin.api.PUT.hasOwnProperty(t)) {
          var defPUT = plugin.api.PUT[t];
          api.delete(prefix + '/' + defPUT.route + apiParams(defPUT), defPUT.fn);
        }
      }

      addResourceRoutes(_cfg_.resources, api);
    }
  }
};

var addResourceRoutes = function(resources, api){
  for(var route in resources){
    if (resources.hasOwnProperty(route)) {
      if(resources[route].exclude){ continue; }

      generator.addRoutes({
        api: api,
        route: route,
        admin: resources[route].admin,
        controller: controllers[route],
        schema: resources[route].schema,
        clean:  resources[route].clean
      });
    }
  }
};

var getViewPath = function(name) {
  var dirname = __dirname.replace('/helpers', '');
  return dirname + pconf.DIR + '/' + name + pconf.VIEWS;
};

var addPluginsWeb = function(web){
  var views = [];
  for(var idx in plugins){
    if(plugins.hasOwnProperty(idx)){
      var name = plugins[idx];
      var prefix = '/' + name;
      var plugin = require(pluginsDir + prefix + pconf.CONFIG);

      for(var idy in plugin.pages){
        var page = plugin.pages[idy];
        views.push(getViewPath(page));
        generator.addPage(web, page);
      }

      for(var route in plugin.resources){
        if(plugin.resources.hasOwnProperty(route)){
          generator.addView(web, route);
        }
      }
    }
  }

  return views;
};

//module.exports.apiParams = apiParams;
module.exports.addPluginsApi = addPluginsApi;
module.exports.addPluginsWeb = addPluginsWeb;
