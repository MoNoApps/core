var app = window.angular.module('coreApp', ['ng', 'ngResource']);
app.run(['$http', function ($http) {
  var token = window.localStorage.getItem('token');
  $http.defaults.headers.common.Token = token;
}]);
window.console.log('ng:app');