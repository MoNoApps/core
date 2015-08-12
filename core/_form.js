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
        indent(3) + F.rocky.value +
        indent(4) + F.input.value +
              '(' + F.input.bind +
             ', ' + F.input.types.text +
             ', ' + F.input.required +
               ')';
      data = data.replace('[[title]]', title);
      data = data.replace('[[field]]', field);
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

module.exports.add = add;
