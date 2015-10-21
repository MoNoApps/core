window.app.controller('HomeController',['$scope', '$rootScope', '$http', function($scope, $rootScope, $http) {

  $scope.token = window.localStorage.getItem('token');
  $scope.view = 'login';

  $scope.guestLogin = function(){
    $scope.user = {
      email: 'guest.match@monoapps.co',
      password: 'demo#2015'
    };
  };

  $scope.enableView = function(name){
    $scope.view = name;
    $scope.alert = false;
    $scope.error = false;
  };

  $scope.isEnabledView = function(name){
    return window.angular.equals($scope.view, name);
  };

  $scope.doRegister = function(){
    $http.post('/api/register/' + $scope.register.email)
    .success(function(data){
      if(data.code !== 'InternalError'){
        $scope.view = 'login';
        $scope.alert = 'User Registered. Read your email inbox and follow instructions.';
        $scope.error = '';
      }
    })
    .error(function(data){
      $scope.alert = '';
      if(data.error){ $scope.error = data.error; }
      else { $scope.error = data; }
    });
  };

  $scope.doRecover = function(){
    $http.post('/api/recover/' + $scope.recover.email)
    .success(function(data){
      if(data.code !== 'InternalError'){
        $scope.view = 'login';
        $scope.alert = 'Read your email inbox and follow instructions.';
        $scope.error = '';
      }
    })
    .error(function(data){
      $scope.alert = '';
      if(data.error){ $scope.error = data.error; }
      else { $scope.error = data; }
    });
  };

  $scope.login = function(){
    $http.post('/api/login', $scope.user)
    .success(function(data) {
      if(data.code !== 'InternalError'){
        $scope.error = false;
        window.localStorage.setItem('token', data.token);
        window.location = '/';
      }
    })
    .error(function(data, status) {
      if(status === 401){ $scope.error = 'Unauthorized'; return false; }
      if(data.error){ $scope.error = data.error; }else{ $scope.error = data; }
    });
  };

}]);
