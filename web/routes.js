// packages
var express = require('express');
var web = express();
var svr = require('http').createServer(web);
var sio = require('socket.io')(svr);
var generator = require('../helpers/generator');
var pages = require('../config.json').pages;
var resources = require('../config.json').resources;
var inspector = require('../helpers/inspector');

// settings
var views = inspector.addPlanksWeb(web);
views.push(__dirname.replace('/web', '/views'));
web.set('views', views);
web.set('view engine', 'jade');
web.use(express.static(__dirname.replace('/web', '/public')));

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
  res.render('index/index', {site: require('../config.json').site});
});

module.exports.web = web;
module.exports.svr = svr;
module.exports.sio = sio;
