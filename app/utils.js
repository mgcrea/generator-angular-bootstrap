'use strict';

var util = require('util');

// Debug
global.d = function() {
  var args = Array.prototype.slice.call(arguments);
  util.log((new Date()).toISOString() + ' - ' + util.inspect.call(null, args.length === 1 ? args[0] : args, false, 10, true));
};
global.dd = function() {
  global.d.apply(null, arguments);
  util.log((new Error()).stack);
  process.exit(1);
};
