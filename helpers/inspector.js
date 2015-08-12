var generator = require('../helpers/generator');
var planks = require('../config.json').planks;
var pconf = require('../config.json').APIVARS.PLANKS;
var planksDir = __dirname.replace('/helpers', pconf.DIR);

var apiParams = function (defRoute) {
  var defParams = '/' + defRoute.route;

  if(defRoute.params) {
    for(var param in defRoute.params) {
      if (param) { defParams += '/:'+ param; }
    }
  }
  return defParams;
};

var addPlanksApi = function(api){
  for(var idx in planks){
    var name = planks[idx];
    var prefix = '/' + name;
    var plank = require(planksDir + prefix + pconf.MAIN);

    for(var g in plank.api.GET) {
      if (plank.api.GET.hasOwnProperty(g)) {
        var defGET = plank.api.GET[g];
        api.get(prefix + apiParams(defGET), defGET.fn);
      }
    }

    for(var p in plank.api.POST) {
      if (plank.api.POST.hasOwnProperty(p)) {
        var defPOST = plank.api.POST[p];
        api.post(prefix + apiParams(defPOST), defPOST.fn);
      }
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
    var name = planks[idx];
    var prefix = '/' + name;
    var plank = require(planksDir + prefix + pconf.CONFIG);

    for(var idy in plank.pages) {
      var page = plank.pages[idy];
      views.push(getViewPath(page));
      generator.addPage(web, page);
    }
  }

  return views;
};

//module.exports.apiParams = apiParams;
module.exports.addPlanksApi = addPlanksApi;
module.exports.addPlanksWeb = addPlanksWeb;
