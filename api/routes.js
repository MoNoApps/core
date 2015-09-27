// packages
var restify = require('restify');

// references
var commons = require('./commons');
var account = require('./account');
var utils = require('../helpers/utils');
var controllers = require('./controllers');
var generator = require('../helpers/generator');
var resources = require("../config.json").resources;
var inspector = require('../helpers/inspector');

// settings
var api = restify.createServer();
api.use(restify.bodyParser());
api.use(restify.queryParser());

inspector.addPluginsApi(api);

// auto generated routes
try{
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
}catch(e){
  console.log(e);
}

// custom routes
api.get('/', commons.ping);
api.get('/ping', commons.ping);
api.post('/login', commons.login);
api.get('/properties', commons.properties);
api.post('/register/:email', commons.signup);
api.post('/recover/:email', commons.recover);
api.get('/email/confirm/:code', commons.confirm);
api.get('/email/recover/:code', commons.rescue);

api.get('/account', account.find);
api.post('/account', account.update);
api.post('/security', account.security);

//console.log(api.router.reverse);

module.exports = api;
