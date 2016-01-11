var F = require('../autoform/content.json');
var indent = require('../autoform/_indent');

var ext = '.jade';
var dir = '/../views/index/forms/';

var add = function (opts) {
  var dest = __dirname + dir + opts.name + ext;
  var model = opts.resource.schema;
  var count = 0;
  var data = F.head + indent(1) + F.fieldset;

  for (var name in model) {
    if (model.hasOwnProperty(name)) {
      var field = model[name];
      count += 1;
      var title = name.charAt(0).toUpperCase() + name.slice(1);
      data +='' +
        indent(2) + F.block.value +
        indent(3) + F.label.value +
        ' ' +       F.label.bind +
        indent(3) + F.rocky.value;

      var hasOptions = '';
      var properties = '';

      for(var prop in field) {
        if (prop==='tag' || prop==='exclude'){ continue; }
        properties += ', ' + prop + '="' + field[prop] + '"';
      }

      switch (field.tag) {
        case 'select':
          for(var s in field.options) {
            data += indent(4) + "option(value='" + s + "') " + field.options[s];
          }
          data += indent(4) + F.select.value +
            '(' + F.select.bind + properties + ')';
          break;
        case 'textarea':
        case 'input':
          data += indent(4) + F.input.value +
            '(' + F.input.bind + properties + ')';
          break;
      }

      data = data.replace('[[title]]', title || name);
      data = data.replace('[[field]]', name);
      data += hasOptions;
    }
  }

  if (count) {
    data += indent(2) + F.actions;
  } else {
    data += indent(2) + F.schema;
  }

  var fs = require('fs');
  fs.writeFile(dest, data);
};

var destroy = function(opts){
  var dest = __dirname + dir + opts.name + ext;
  var fs = require('fs');
  if(fs.existsSync(dest)){
    fs.unlink(dest);
  }
};

module.exports.add = add;
module.exports.destroy = destroy;
