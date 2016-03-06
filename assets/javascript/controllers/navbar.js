window.app.controller('NavBarController',['$scope','$rootScope', '$http', function($scope, $rootScope, $http) {

  $scope.search = '';
  $scope.themes = [];
  $scope.resources = [];
  $scope.token = window.localStorage.getItem('token');

  var getTheme = function() {
    $http.get('/api/theme')
    .success(function(data) {
      var tbase = data.theme;
      var theme = window.localStorage.getItem('theme');
      if(theme === null) { return tbase;  }
      else{ return theme; }
    });
  };

  $scope.setTheme = function(theme) {
    $scope.theme = theme.css;
    window.localStorage.setItem('theme', theme.css);
  };

  $scope.delTheme = function() {
    $scope.theme =  false;
    window.localStorage.removeItem('theme');
  };

  $scope.setResource = function(resource) {
    window.location.pathname = '/' + resource;
  };

  $scope.logout = function() {
    window.localStorage.removeItem('token');
    window.location = '/';
  };

  $scope.getProperties = function() {
    if(!$scope.token){ return; }
    $http.get('/api/properties')
    .success(function(data) {
      if(data.code !== "InternalError") {
        $scope.themes = data.themes;
        $scope.resources = data.resources;
        $rootScope.$emit('load:commons', data.commons || {});
        $rootScope.$emit('load:resources', data.resources || []);
      }
    })
    .error(function(data, status) {
      if(status === 401){
        window.localStorage.clear();
        window.location = '/';
      }

      console.log(data);
    });
  };

  $scope.capitalize = function(text) {
    return text.charAt(0).toUpperCase() + text.substring(1, text.length);
  };

  function isHttp() {
    return window.location.protocol === 'http:';
  }

  function goHttpsUrl() {
    window.location =  window.location.href.replace('http:','https:');
  }

  $scope.isHttp = isHttp;
  $scope.goHttpsUrl = goHttpsUrl;

  $rootScope.$on('load:param', function (event, data) {
    $scope.model = data;
    console.log('load:param');
  });

  $scope.$watch('search', function(value) {
    $rootScope.$emit('watch:search', value);
  });

  $scope.theme = getTheme();

  $scope.getProperties();

}]);
