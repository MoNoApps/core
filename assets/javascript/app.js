(function (NG) {
  'use strict';

  NG.module('coreApp', ['ngResource'])
    .run(['$http', function ($http) {
      $http.defaults.headers.common.Token = window.localStorage.getItem('token');
    }]);
})(window.angular);