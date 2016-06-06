var CONFIG = require('../config.json');

var browser = function (req, res, next) {
  var regex = /(MSIE [1-3].0|Mozilla\/4.0)/g;
  var header = req.headers['user-agent'];
  header = header ? header.match(regex) : false;

  if (header && header.length) {
    return res.render('browser');
  }

  next();
};

var robots = function (req, res, next) {
  var regex = /(robots.txt)/g;
  var content = 'User-agent: *\nDisallow: /\n';
  var robots = req.url.toLowerCase().match(regex);

  if (robots && robots.length) {
    res.set('Content-Type', 'text/plain');
    return res.send(content);
  }

  next();
};

var trusted = function (req, res, next) {
  var ipaddress = req.headers['x-forwarded-for'];
  if (CONFIG.ALLOW.indexOf(ipaddress) === -1) {
    res.header('Location', CONFIG.URL.BASE);
    return res.sendStatus(302);
  }

  next();
};

module.exports.robots = robots;
module.exports.browser = browser;
module.exports.trusted = trusted;
