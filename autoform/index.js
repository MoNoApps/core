var readline = require('readline');
var wizard = require('../autoform/_wizard');
var form = require('../autoform/_form');
var fill = require('../autoform/_fill');
var ry = new RegExp(/^(?:y|yes)$/);
var cfg = require('../config.json');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function doWizard (done) {
  wizard( function (res) {
    if (res.missing.length) {

      console.log('\n[00:00:01] You have missing forms: ' + res.missing);

      if (cfg.autoform) {
        generator(res);
        return done();
      }

      rl.question('\n[00:00:02] Do you want to create forms (y/N)?', function(a) {
        if (ry.test(a)) {
          generator(res);
        }

        rl.close();
        done();
      });
    } else {
      console.log('[00:00:00] Forms by models are OK.');
      done();
    }
  });
}

function generator (res) {
  fill(res.models);
  for (var i in res.missing) {
    form.add({
      name: res.missing[i],
      resource: {
        schema: res.schemas[res.missing[i]].schema
      }
    });
  }
}

module.exports = doWizard;
