var F = require('../autoform/content.json');

var indent = function (n) {
  var tabs = '\n';

  for(var i=0; i<n; i++) {
    tabs += F.tab;
  }

  return tabs;
};

module.exports = indent;
