var fs = require('fs');
var indent = require('../autoform/_indent');

var fill = function (models) {
  var content = ".row.ng-cloak(ng-switch='model')" +
  indent(1) + ".col-sm-12.col-md-3(ng-class='{\"hidden-xs hidden-sm\": roco, \"col-xs-12 col-sm-12\": !roco}')" +
  indent(2) + "include ../navs/list" +
  indent(2) + "include ../navs/empty" +
  indent(1) + ".col-sm-12.col-md-9(ng-class='{\"hidden-xs hidden-sm\": !roco, \"col-xs-12 col-sm-12\": roco}')";

  for (var m in models) {
    content += indent(2) + "div(ng-switch-when='" + models[m] + "')" +
               indent(3) + "include ../forms/" + models[m];
  }

  var dest = __dirname + '/../views/index/sections/switch-model.jade';
  fs.unlink(dest, function() {
    fs.writeFile(dest, content);
  });
};

module.exports = fill;
