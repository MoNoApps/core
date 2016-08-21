// packages
var express = require('express');
var web = express();
var svr = require('http').createServer(web);
var sio = require('socket.io')(svr);
var generator = require('../helpers/generator');
var config = require('../config.json');
var pages = config.pages;
var resources = config.resources;
var inspector = require('../helpers/inspector');
var middleware = require('../helpers/middleware');

// settings
var views = inspector.addPluginsWeb(web, express);
views.push(__dirname.replace('/web', '/views'));
web.set('views', views);
web.set('view engine', 'pug');
web.use(express.static(__dirname.replace('/web', '/public')));
// web.use(middleware.trusted);
web.use(middleware.robots);
web.use(middleware.browser);

// resources
for(var route in resources){
  if(resources.hasOwnProperty(route)){
    generator.addView(web, route);
  }
}

// additions
for(var p in pages){
  if(resources.hasOwnProperty(route)){
    var page = pages[p];
    generator.addPage(web, page);
  }
}

// main
web.get('/', function(req, res){
  res.render(config.INDEX, {
    model: false,
    site: config.site,
    theme: config.theme
  });
});

web.get('/templates/:name', function (req, res) {
  res.render('templates/' + req.params.name);
});

//console.log(web._router.stack);

module.exports.web = web;
module.exports.svr = svr;
module.exports.sio = sio;
