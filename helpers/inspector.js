var generator = require('../helpers/generator');
var controllers = require('../api/controllers');
var planks = require('../config.json').planks;
var pconf = require('../config.json').APIVARS.PLANKS;
var planksDir = __dirname.replace('/helpers', pconf.DIR);

var apiParams = function (defRoute) {
  var defParams = '';

  if(defRoute.params) {
    for(var param in defRoute.params) {
      if (param) { defParams += '/:'+ param; }
    }
  }
  return defParams;
};

var addPlanksApi = function(api){
  for(var idx in planks){
    if(planks.hasOwnProperty(idx)){
      var name = planks[idx];
      var prefix = '/' + name;
      var plank = require(planksDir + prefix + pconf.MAIN);
      var _cfg_ = require(planksDir + prefix + pconf.CONFIG);

      for(var g in plank.api.GET) {
        if (plank.api.GET.hasOwnProperty(g)) {
          var defGET = plank.api.GET[g];
          api.get(prefix + '/' + defGET.route + apiParams(defGET), defGET.fn);
        }
      }

      for(var p in plank.api.POST) {
        if (plank.api.POST.hasOwnProperty(p)) {
          var defPOST = plank.api.POST[p];
          api.post(prefix + '/' + defPOST.route + apiParams(defPOST), defPOST.fn);
        }
      }

      for(var d in plank.api.DELETE) {
        if (plank.api.DELETE.hasOwnProperty(d)) {
          var defDELETE = plank.api.DELETE[d];
          api.del(prefix + '/' + defDELETE.route + apiParams(defDELETE), defDELETE.fn);
        }
      }

      for(var t in plank.api.PUT) {
        if (plank.api.PUT.hasOwnProperty(t)) {
          var defPUT = plank.api.PUT[t];
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

var addPlanksWeb = function(web){
  var views = [];
  for(var idx in planks){
    if(planks.hasOwnProperty(idx)){
      var name = planks[idx];
      var prefix = '/' + name;
      var plank = require(planksDir + prefix + pconf.CONFIG);

      for(var idy in plank.pages){
        var page = plank.pages[idy];
        views.push(getViewPath(page));
        generator.addPage(web, page);
      }

      for(var route in plank.resources){
        if(plank.resources.hasOwnProperty(route)){
          generator.addView(web, route);
        }
      }
    }
  }

  return views;
};

//module.exports.apiParams = apiParams;
module.exports.addPlanksApi = addPlanksApi;
module.exports.addPlanksWeb = addPlanksWeb;
