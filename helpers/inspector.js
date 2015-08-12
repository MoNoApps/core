var apiParams = function (defRoute) {
  var defParams = '/' + defRoute.route;

  if(defRoute.params) {
    for(var param in defRoute.params) {
      if (param) {
        defParams += '/:'+ param;
      }
    }
  }
  return defParams;
};

module.exports.apiParams = apiParams;
