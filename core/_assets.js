var planks = require('../config.json').planks;

module.exports = function(cb) {
  var js = [];
  var ng = [];
  var st = [];

  ng.push('assets/javascript/app.js');
  ng.push('assets/javascript/services/*.js');
  ng.push('assets/javascript/controllers/*.js');
  js.push('./helpers/*.js');
  js.push('./api/*.js');
  js.push('./web/*.js');
  js.push('./core/*.js');
  js.push('./*.js');
  js.push('assets/javascript/*.js');
  js.push('assets/javascript/services/*.js');
  js.push('assets/javascript/controllers/*.js');
  js.push('test/*.js');
  js.push('test/e2e/*.js');
  js.push('test/helpers/*.js');
  st.push('assets/styles/*.css');

  for(var idx in planks){
    if(planks.hasOwnProperty(idx)){
      var name = planks[idx];
      js.push('planks/' + name + '/helpers/*.js');
      js.push('planks/' + name + '/api/*.js');
      js.push('planks/' + name + '/*.js');
      js.push('planks/' + name + '/web/*.js');
      js.push('planks/' + name + '/api/*.js');
      js.push('planks/' + name + '/assets/javascript/*.js');
      js.push('planks/' + name + '/assets/javascript/services/*.js');
      js.push('planks/' + name + '/assets/javascript/controllers/*.js');
      js.push('planks/' + name + '/test/*.js');
      js.push('planks/' + name + '/test/e2e/*.js');
      js.push('planks/' + name + '/test/helpers/*.js');
      ng.push('planks/' + name + '/assets/javascript/services/*.js');
      ng.push('planks/' + name + '/assets/javascript/controllers/*.js');
      st.push('planks/' + name + '/assets/styles/*.css');
    }
  }

  cb(js, ng, st);
};
