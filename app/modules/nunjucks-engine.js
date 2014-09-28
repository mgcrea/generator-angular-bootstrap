'use strict';

var nunjucks = require('nunjucks');
var env = new nunjucks.Environment();
    // _ = require('underscore.string');

function engine(source, data) {
  env.addFilter('split', function(str, val) {
    return str.split(val);
  });
  env.addFilter('contains', function(array, val) {
    return array.indexOf(val) !== -1;
  });
  env.addFilter('modules', function(array) {
    return array.length ? '\'' + array.join('\', \'') + '\'' : '';
  });
  return env.renderString(source, data);
}

engine.detect = function(body) {
  return body.indexOf('{%') > -1 || body.indexOf('{{') > -1;
};




// ['camelize', 'dasherize', 'underscored'].forEach(function(helper) {
//   Handlebars.registerHelper(helper, _[helper]);
// });

module.exports = engine;
