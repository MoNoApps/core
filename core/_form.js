var F = require('../core/content.json');
var indent = require('../core/_indent');

var ext = '.jade';
var dir = '/../views/index/forms/';

var add = function (opts) {
  var dest = __dirname + dir + opts.name + ext;
  var model = opts.resource.schema;
  var data =    F.head +
    indent(1) + F.fieldset;
  var count = 0;

  for (var field in model) {
    if (model.hasOwnProperty(field)) {
      count += 1;
      var title = field.charAt(0).toUpperCase() + field.slice(1);
      data +='' +
      indent(2) + F.block.value +
      indent(3) + F.label.value +
        ' ' + F.label.bind +
      indent(3) + F.rocky.value;

      var hasOptions = '';
      var properties = '';

      for(var prop in field.properties) {
        properties += indent(3) + ', ' + prop + '="' + field.properties[prop] + '"';
      }

      switch (field.tag) {
        case 'select':
          for(var s in field.options) {
            data += indent(4) + "option(value='" + s + "') " + field.options[s];
          }
          data += indent(4) + F.input.value +
            '(' + F.input.bind + properties + ')';
          break;
        case 'label':
        case 'area':
        case 'image':
        case 'input':
          data += indent(4) + F.select.value +
            '(' + F.select.bind + properties + ')';
          break;
      }

      data = data.replace('[[title]]', field.title || field);
      data = data.replace('[[field]]', field);
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
