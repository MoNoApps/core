window.app.controller('AccountController',['$scope', '$rootScope', '$http', function($scope, $rootScope, $http) {

  //---- common vars ----//
  $scope.token = window.localStorage.getItem('token');

  //---- public functions ----//
  $scope.saveAccount = function(){
    $http.post('/api/account', $scope.account)
    .success(function() {
      $scope.success = 'Account updated';
      console.log('post:account');
    })
    .error(function() {
      $scope.error = 'Fail updating';
    });
  };

  $scope.isNotValid = function(){
    if($scope.newPwd !== $scope.again) {
      $scope.alert = 'Password does not match';
      return true;
    }else{
      $scope.alert = '';
    }
    if(!$scope.password || !$scope.newPwd){
      return true;
    }else{
      $scope.alert = '';
    }
  };

  $scope.changePwd = function(){
    var query = {};
    query.password = $scope.password;
    query.newPwd = $scope.newPwd;
    query.again = $scope.again;

    $http.post('/api/security', query )
    .success(function() {
      $scope.success = 'Password updated';
      console.log('post:account');
    })
    .error(function() {
      $scope.error = 'Fail updating';
    });
  };

  //---- private functions ----//
  var getAccount = function(){
    $http.get('/api/account')
    .success(function(data) {
      $scope.account = data;
      console.log('info:account');
    })
    .error(function() {
      $scope.error = 'Fail geting account details';
      console.log('get:account');
    });
  };

  //---- event listeners ----//
  $rootScope.$on('change:model', function (event, data) {
    window.location.pathname = '/' + data + '/new';
    console.log('change:model');
  });

  //----   init  ---//
  if($scope.token){
    getAccount();
  }

}]);
