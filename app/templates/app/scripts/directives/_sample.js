'use strict';

angular.module('{{ props.moduleName }}')

  .directive('ngHelloWorld', function() {

    return {
      restrict: 'EAC',
      scope: true,
      compile: function compile(tElement, tAttrs) {
        {%- raw %}
        tElement.html('<span>hello {{name}}</span>');
        {% endraw -%}
        return function postLink(scope, element, attrs, controller) {
          scope.name = 'world';
        };
      }
    };

  });
