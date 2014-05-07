'use strict';

angular.module('<%= props.moduleName %>', [<%= props.appModules.length ? '\'' + props.appModules.join('\', \'') + '\'' : '' %>])

  .constant('version', 'v<%= props.version %>')
<% if(props.ngModules.indexOf('route') !== -1) { %>
  .config(function($locationProvider, $routeProvider) {

    $locationProvider.html5Mode(false);

    $routeProvider
      .when('/', {
        templateUrl: 'views/home.html'
      })
      .when('/features', {
        templateUrl: 'views/features.html'
      })
      .when('/contact', {
        templateUrl: 'views/contact.html'
      })
      .otherwise({
        redirectTo: '/'
      });

  });
<% } else { %>
  .config(function($locationProvider) {

    $locationProvider.html5Mode(false);

  });
<% } %>
