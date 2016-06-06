var cfg = require('./config.json').port;
var api = require('./api/routes');
var svr = require('./web/routes').svr;
var sio = require('./sio/routes');

api.listen(cfg.api, function () {
  console.log('app server up!');
});

svr.listen(cfg.web, function () {
  console.log('web server up!');
});

sio.listen(function () {
  console.log('sio server up!');
});
