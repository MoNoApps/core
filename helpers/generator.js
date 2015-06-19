// references
var Zappy = require('../helpers/zappy').Zappy;
var AV    = require('../config.json').APIVARS;

// API
var addRoutes = function(opts){
  var zappy = new Zappy(opts);

  opts.api.get( AV.PRE + opts.route, function(req, res){
    zappy.Get(req, res);
  });
  opts.api.get( AV.PRE + opts.route + AV.ID, function(req, res){
    zappy.GetOne(req, res);
  });
  opts.api.del( AV.PRE + opts.route + AV.ID, function(req, res){
    zappy.Del(req, res);
  });
  opts.api.post(AV.PRE + opts.route, function(req, res){
    zappy.Post(req, res);
  });
  opts.api.put( AV.PRE + opts.route + AV.ID, function(req, res){
    zappy.Put(req, res);
  });
};

// WEB
var addView =  function(web, route){
  web.get(['/' + route, '/' + route + '/:id', '/' + route + '/new'] , function(req, res){
    res.render('index/index',{model: route, id: req.params.id});
  });
};

module.exports.addView = addView;
module.exports.addRoutes = addRoutes;
