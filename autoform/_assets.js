var plugins = require('../config.json').plugins;

module.exports = function (cb) {
  var js = [];
  var ng = [];
  var st = [];

  ng.push('assets/javascript/app.js');
  ng.push('assets/javascript/services/*.js');
  ng.push('assets/javascript/controllers/*.js');
  ng.push('assets/javascript/directives/*.js');
  js.push('./helpers/*.js');
  js.push('./api/*.js');
  js.push('./web/*.js');
  js.push('./autoform/*.js');
  js.push('./*.js');
  js.push('assets/javascript/*.js');
  js.push('assets/javascript/services/*.js');
  js.push('assets/javascript/controllers/*.js');
  js.push('assets/javascript/directives/*.js');
  js.push('test/*.js');
  js.push('test/e2e/*.js');
  js.push('test/helpers/*.js');
  st.push('assets/styles/*.css');

  for (var idx in plugins) {
    if (plugins.hasOwnProperty(idx)) {
      var name = plugins[idx];
      js.push('plugins/' + name + '/helpers/*.js');
      js.push('plugins/' + name + '/api/*.js');
      js.push('plugins/' + name + '/*.js');
      js.push('plugins/' + name + '/web/*.js');
      js.push('plugins/' + name + '/api/*.js');
      js.push('plugins/' + name + '/assets/javascript/*.js');
      js.push('plugins/' + name + '/assets/javascript/services/*.js');
      js.push('plugins/' + name + '/assets/javascript/controllers/*.js');
      js.push('plugins/' + name + '/assets/javascript/directives/*.js');
      js.push('plugins/' + name + '/test/*.js');
      js.push('plugins/' + name + '/test/e2e/*.js');
      js.push('plugins/' + name + '/test/helpers/*.js');
      ng.push('plugins/' + name + '/assets/javascript/services/*.js');
      ng.push('plugins/' + name + '/assets/javascript/controllers/*.js');
      ng.push('plugins/' + name + '/assets/javascript/directives/*.js');
      st.push('plugins/' + name + '/assets/styles/*.css');
    }
  }

  cb(js, ng, st);
};
