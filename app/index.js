'use strict';
// @cli $ nodemon -w ~/DropboxBackup/Developer/yeoman/generator-gular-bootstrap -x yo angular-bootstrap

// Required modules
//
var util = require('util'), utils = require('./modules/utils');
var path = require('path');
var Promise = require('bluebird');
var semver = require('semver');
var github = require('./modules/github');
var debug = false;

var Generator = module.exports = require('./modules/generator');

Generator.prototype.setup = function() {

  var self = this, _ = this._, props = this.props, done = this.async();

  // Have Yeoman greet the user.
  console.log(self.yeoman);

  var components = self.components = {
    'angular/angular.js': ['~1.3.0', '~1.2.0'],
    'twbs/bootstrap': ['^3.0'],
    'fortawesome/font-awesome': ['^4.0'],
    'mgcrea/angular-strap': ['^2.0'],
    'mgcrea/angular-motion': ['^0.3'],
    'mgcrea/bootstrap-additions': ['^0.2'],
    'angular-ui/ui-router': ['^0.2']
  };

  var promise = debug ?
    Promise.resolve(JSON.parse('{"ngVersion":"~1.3.0","ngModules":["animate","route"],"components":["twbs/bootstrap","fortawesome/font-awesome","mgcrea/angular-strap","mgcrea/angular-motion","mgcrea/bootstrap-additions"],"buildSystem":"gulp","htmlPreprocessor":"jade","jsPreprocessor":"none","cssPreprocessor":"less","supportLegacy":"no","name":"admin","license":"MIT","user":"mgcrea"}'))
    .then(function(_props) { _.extend(props, _props); }) :
  //   Promise.all(Object.keys(components).map(function(component) {
  //   var minors = {};
  //   return github.tags(component, components[component]).filter(function(vObj, i) {
  //     // return i === 0;
  //     d(vObj);
  //     var vMinor = [vObj.major, vObj.minor].join('.');
  //     return !minors[vMinor] && (minors[vMinor] = true);
  //   }).map(function(vObj) {
  //     return vObj.toString();
  //   }).then(function(tags) {
  //     components[component] = tags;
  //     return tags;
  //   });
  // })).catch(function(err) {
  //   d(err);
  //   console.log('/!\\ Tag fetching failed, fallback to last known defaults.');
  //   components = JSON.parse('{"angular/angular.js":["^1.3.0","^1.2.0"],"twbs/bootstrap":["^3.0"],"fortawesome/font-awesome":["v4.0.3"],"mgcrea/angular-strap":["v2.0.2"],"mgcrea/angular-motion":["v0.3.2"],"mgcrea/bootstrap-additions":["v0.2.2"],"angular-ui/ui-router":["0.2.10"]}');
  // })
  Promise.resolve()
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

    return self.promptAsync([
    // {
    //   name: 'buildSystem',
    //   message: 'What build system would I use?',
    //   type: 'list',
    //   choices: ['gulp', 'grunt'],
    //   default: 0
    // },
    {
      name: 'htmlPreprocessor',
      message: 'Should I set up one of those HTML preprocessors for you?',
      type: 'list',
      choices: ['none', 'jade'],
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
      message: 'Under which license your project shall be released?',
      default: 'MIT'
    },
    {
      name: 'user',
      message: 'Would you mind telling me your username on GitHub?',
      default: 'mgcrea'
    }]);

  });

  return promise.then(function() {
    console.log(JSON.stringify(props));

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
    return debug ? Promise.resolve(props.github = JSON.parse('{"login":"mgcrea","id":108273,"avatar_url":"https://avatars.githubusercontent.com/u/108273?v=2","gravatar_id":"","url":"https://api.github.com/users/mgcrea","html_url":"https://github.com/mgcrea","followers_url":"https://api.github.com/users/mgcrea/followers","following_url":"https://api.github.com/users/mgcrea/following{/other_user}","gists_url":"https://api.github.com/users/mgcrea/gists{/gist_id}","starred_url":"https://api.github.com/users/mgcrea/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/mgcrea/subscriptions","organizations_url":"https://api.github.com/users/mgcrea/orgs","repos_url":"https://api.github.com/users/mgcrea/repos","events_url":"https://api.github.com/users/mgcrea/events{/privacy}","received_events_url":"https://api.github.com/users/mgcrea/received_events","type":"User","site_admin":false,"name":"Olivier Louvignes","company":"Freelance","blog":"http://olouv.com","location":"Paris, France","email":"olivier@mg-crea.com","hireable":true,"bio":null,"public_repos":104,"public_gists":13,"followers":339,"following":78,"created_at":"2009-07-24T09:50:40Z","updated_at":"2014-09-26T16:59:20Z"}')) :
    github.user(props.user).then(function(user) {
      console.log(JSON.stringify(user));
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
    self.template('_gulpfile.js', 'gulpfile.js');
    self.template('_package.json', 'package.json');
    self.template('_bower.json', 'bower.json');
    self.template('_README.md', 'README.md');


  })
  .then(function setupAppFiles() {

    var htmlExt = props.htmlPreprocessor === 'jade' ? 'jade' : 'html';

    self.mkdir('app');
    self.template('app/_index.' + htmlExt, 'app/index.' + htmlExt);

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
    self.copy('app/views/contact.' + htmlExt, 'app/views/contact.' + htmlExt);
    self.copy('app/views/features.' + htmlExt, 'app/views/features.' + htmlExt);
    self.copy('app/views/home.' + htmlExt, 'app/views/home.' + htmlExt);
    self.mkdir('app/views/partials');
    self.copy('app/views/partials/header.' + htmlExt, 'app/views/partials/header.' + htmlExt);
    self.copy('app/views/partials/footer.' + htmlExt, 'app/views/partials/footer.' + htmlExt);

  })
  .then(function() {
    done();
  });

};
