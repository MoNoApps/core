var app = window.angular.module('coreApp', ['ng', 'ngResource']);

app.run(['$http', function($http) {
  var token = window.localStorage.getItem('token');
  if(!token){ 
    //window.location = '/';
    $http.defaults.headers.common.Token = token;
  }
}]);

window.console.log('ng:app');
