var F = require('../core/content.json');

module.exports = function (n) {
  var tabs = '\n';

  for(var i=0; i<n; i++) {
    tabs += F.tab;
  }

  return tabs;
};
