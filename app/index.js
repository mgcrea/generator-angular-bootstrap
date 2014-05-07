'use strict';

// Required modules
//
var util = require('util'), utils = require('./utils');
var path = require('path');
var Promise = require('bluebird');
var needle = Promise.promisifyAll(require('needle'));
var semver = require('semver');
var github = require('./github');
var debug = false;

var Generator = module.exports = require('./generator');

Generator.prototype.setup = function() {
  var self = this, _ = this._, props = this.props, done = this.async();

  // Have Yeoman greet the user.
  console.log(self.yeoman);

  var components = self.components = {
    'angular/angular.js': '^1.0.0',
    'twbs/bootstrap': '^3.1.0',
    'fortawesome/font-awesome': '^4.0.0',
    'mgcrea/angular-strap': '^2.0.0',
    'mgcrea/angular-motion': '^0.3.0',
    'mgcrea/bootstrap-additions': '^0.2.0',
    'angular-ui/ui-router': '^0.2.0'
  };

  var promise = debug ?
    Promise.resolve(JSON.parse('{"ngVersion":"v1.3.0-beta.7","ngModules":["animate","route"],"components":["twbs/bootstrap","mgcrea/angular-strap","mgcrea/angular-motion","mgcrea/bootstrap-additions"],"buildSystem":"gulp","jsPreprocessor":"none","cssPreprocessor":"less","supportLegacy":"no","name":"test-generator-angular-bootstrap","license":"MIT","user":"mgcrea"}'))
    .then(function(_props) { _.extend(props, _props); }) :
    Promise.all(Object.keys(components).map(function(component) {
    var minors = {};
    return github.tags(component, components[component]).filter(function(vObj) {
      var vMinor = [vObj.major, vObj.minor].join('.');
      return !minors[vMinor] && (minors[vMinor] = true);
    }).map(function(vObj) {
      return vObj.toString();
    }).then(function(tags) {
      components[component] = tags;
      return tags;
    });
  })).catch(function(err) {
    console.log('/!\\ Tag fetching failed, fallback to last known defaults.');
    components = JSON.parse('{"angular/angular.js":["v1.3.0-beta.7","v1.2.16","v1.1.5"],"twbs/bootstrap":["v3.1.1"],"fortawesome/font-awesome":["v4.0.3"],"mgcrea/angular-strap":["v2.0.2"],"mgcrea/angular-motion":["v0.3.2"],"mgcrea/bootstrap-additions":["v0.2.2"],"angular-ui/ui-router":["0.2.10"]}');
  })
  .then(function askForAngular() {
    return self.promptAsync([{
      name: 'ngVersion',
      message: 'What version of angular would you like to use?',
      validate: function(value) {
        return semver.validRange(value) ? true : 'Please enter a valid semantic version (semver.org)';
      },
      type: 'list',
      choices: components['angular/angular.js'],
      default: 0
    }, {
      name: 'ngModules',
      message: 'Which official angular modules would you need?',
      type: 'checkbox',
      choices: [{name: 'animate', checked: true}, 'cookies', 'i18n', 'resource', {name: 'route', checked: true}, 'sanitize', 'touch']
    }, {
      name: 'locale',
      message: 'Should I preload a specific i18n-locale file?',
      when: function(props) {
        return props.ngModules.indexOf('i18n') !== -1;
      },
      type: 'list',
      choices: ['en', 'de', 'es', 'fr'],
      default: 0
    }]);
  })
  .then(function askForComponents() {

    var choices = Object.keys(components)
    .filter(function(k) { return k !== 'angular/angular.js'; })
    .map(function(k) { return {name: k + ' (' + components[k] + ')', value: k}; });
    choices[0].checked = true;

    return self.promptAsync([{
      name: 'components',
      message: 'Any third-party component you might require?',
      type: 'checkbox',
      choices: choices,
    }]);

  })
  .then(function askForBuildSettings() {

    return self.promptAsync([{
      name: 'buildSystem',
      message: 'What build system would I use?',
      type: 'list',
      choices: ['gulp', 'grunt'],
      default: 0
    },
    {
      name: 'jsPreprocessor',
      message: 'Should I set up one of those JS preprocessors for you?',
      type: 'list',
      choices: ['none', 'coffee'],
      default: 0
    },
    {
      name: 'cssPreprocessor',
      message: 'Should I set up one of those CSS preprocessors for you?',
      type: 'list',
      choices: ['none', 'less', 'sass'],
      default: 1
    },
    {
      name: 'supportLegacy',
      message: 'Would you want me to support old versions of Internet Explorer (eg. before IE9)?',
      type: 'list',
      choices: ['yes', 'no'],
      default: 1
    }]);

  })
  .then(function() {

    return self.promptAsync([{
      name: 'name',
      message: 'What\'s the base name of your project?',
      default: path.basename(process.env.PWD)
    },
    {
      name: 'license',
      message: 'Under which lincense your project shall be released?',
      default: 'MIT'
    },
    {
      name: 'user',
      message: 'Would you mind telling me your username on GitHub?',
      default: 'mgcrea'
    }]);

  });

  return promise.then(function() {

    props.dashName = _.dasherize(props.name);
    if(!props.locale) props.locale = 'en';
    props.title = _.classify(props.name);
    props.moduleName = (props.user ? props.user + '.' : '') + props.title;
    props.description = 'Yet another amazing AngularJS app';
    props.version = '0.1.0';

    props.appModules = _.clone(props.ngModules)
    .filter(function(name) {
      return name !== 'i18n';
    })
    .map(_.classify)
    .map(function(name) {
      return 'ng' + name;
    });
    if(props.components.indexOf('mgcrea/angular-strap') !== -1) {
      props.appModules.push('mgcrea.ngStrap');
    }

    if(!props.user) return;
    return github.user(props.user).then(function(user) {
      props.github = user;
    }).catch(function(err) {
      console.log('/!\\ User fetching failed.');
    });

  })
  .then(function setupProjectFiles() {

    // Dotfiles
    self.copy('gitignore', '.gitignore');
    self.copy('gitattributes', '.gitattributes');
    self.copy('editorconfig', '.editorconfig');
    self.copy('jshintrc', '.jshintrc');
    self.copy('bowerrc', '.bowerrc');

    // Package
    if(props.buildSystem === 'grunt') self.template('_Gruntfile.js', 'Gruntfile.js');
    if(props.buildSystem === 'gulp') self.template('_gulpfile.js', 'gulpfile.js');
    self.template('_package.json', 'package.json');
    self.template('_bower.json', 'bower.json');
    self.template('_README.md', 'README.md');


  })
  .then(function setupAppFiles() {

    self.mkdir('app');
    self.template('app/_index.html', 'app/index.html');

    // Scripts
    self.mkdir('app/scripts');
    self.template('app/scripts/_app.js', 'app/scripts/app.js');
    self.mkdir('app/scripts/controllers');
    self.template('app/scripts/controllers/_main.js', 'app/scripts/controllers/main.js');
    self.mkdir('app/scripts/directives');
    self.template('app/scripts/directives/_sample.js', 'app/scripts/directives/sample.js');
    self.mkdir('app/scripts/filters');
    self.template('app/scripts/filters/_sample.js', 'app/scripts/filters/sample.js');
    self.mkdir('app/scripts/services');
    self.template('app/scripts/services/_sample.js', 'app/scripts/services/sample.js');

    // Styles
    self.mkdir('app/styles');
    if(props.cssPreprocessor === 'less') {
      self.template('app/styles/_main.less', 'app/styles/main.less');
    } else {
      self.template('app/styles/_main.css', 'app/styles/main.css');
    }

    // Views
    self.mkdir('app/views');
    self.copy('app/views/contact.html', 'app/views/contact.html');
    self.copy('app/views/features.html', 'app/views/features.html');
    self.copy('app/views/home.html', 'app/views/home.html');
    self.mkdir('app/views/partials');
    self.copy('app/views/partials/header.html', 'app/views/partials/header.html');
    self.copy('app/views/partials/footer.html', 'app/views/partials/footer.html');

  })
  .then(function() {
    done();
  });

};
