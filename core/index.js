var readline = require('readline');
var wizard = require('../core/_wizard');
var form = require('../core/_form');
var ry = new RegExp(/^(?:y|yes)$/);

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

module.exports = function (done) {
wizard( function (res) {
  if(res.missing.length) {
    console.log('\nYou have missing forms: ' + res.missing);
    rl.question('\nDo you want to create forms (y/N)?', function(a) {
      if (ry.test(a)) {
        for (var i in res.missing) {
          form.add({name: res.missing[i], resource: res.resources[res.missing[i]]});
        }
      }

      rl.close();
      done();
    });
  }else{
    console.log('[00:00:00] Forms by models are OK.');
    done();
  }
});
};
