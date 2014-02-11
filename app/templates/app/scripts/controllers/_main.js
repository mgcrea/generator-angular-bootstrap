'use strict';

angular.module('<%= props.ghUser ? props.ghUser + '.' : '' %><%= props.title %>')

  .controller('MainCtrl', function($scope, $location, version) {

    $scope.$path = $location.path.bind($location);
    $scope.version = version;

  });
