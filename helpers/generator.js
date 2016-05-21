// references
var Zappy = require('../helpers/zappy').Zappy;
var site = require('../config.json').site;
var theme = require('../config.json').theme;
var AV = require('../config.json').APIVARS;

// API
var addRoutes = function (opts) {
  var zappy = new Zappy(opts);

  opts.api.get(AV.PRE + opts.route, function (req, res) {
    zappy.Get(req, res);
  });
  opts.api.get(AV.PRE + opts.route + AV.ID, function (req, res) {
    zappy.GetOne(req, res);
  });
  opts.api.del(AV.PRE + opts.route + AV.ID, function (req, res) {
    zappy.Del(req, res);
  });
  opts.api.post(AV.PRE + opts.route, function (req, res) {
    zappy.Post(req, res);
  });
  opts.api.put(AV.PRE + opts.route + AV.ID, function (req, res) {
    zappy.Put(req, res);
  });
};

// WEB VIEW
var addView = function (web, model) {
  web.get(
    ['/' + model,
      '/' + model + '/:id', '/' + model + '/new'],
    function (req, res) {
      var _id = req.params.id;

      res.render('index/index', {
        id: _id,
        site: site,
        model: model,
        theme: theme
      });
    }
  );
};

//WEB PAGE
var addPage = function (web, name) {
  web.get('/' + name, function (req, res) {
    res.render(name + '/index', {
      site: site,
      model: false,
      theme: theme
    });
  });
};

module.exports.addView = addView;
module.exports.addPage = addPage;
module.exports.addRoutes = addRoutes;
