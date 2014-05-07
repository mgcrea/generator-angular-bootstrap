'use strict';

var util = require('util');
var path = require('path');
var yeoman = require('yeoman-generator');
var Promise = require('bluebird');

function Generator(args, options, config) {
  var self = this;

  yeoman.generators.Base.apply(self, arguments);

  self.on('end', function() {
    self.installDependencies({skipInstall: options['skip-install']});
  });

  self.pkg = JSON.parse(self.readFileAsString(path.join(__dirname, '../package.json')));

  var props = self.props = {};
  self.promptAsync = function(questions) {
    return new Promise(function(resolve, reject) {
      self.prompt(questions, function(props) {
        self._.extend(self.props, props);
        resolve(self.props);
      });
    });
  };

}

util.inherits(Generator, yeoman.generators.Base);

module.exports = Generator;
