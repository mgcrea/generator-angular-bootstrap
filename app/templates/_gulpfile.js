// Generated using {{ pkg.name }} {{ pkg.version }}
// (new Date).toISOString().split('T')[0]
'use strict';

var gulp = require('gulp');
var path = require('path');
var util = require('util');
var pkg = require('./package.json');
var fs = require('fs');

// Gulp plugins
var changed = require('gulp-changed');
var concat = require('gulp-concat-util');
var debug = require('gulp-debug');
var filter = require('gulp-filter');
var gutil = require('gulp-util');
var merge = require('merge-stream');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');

var src = {
  cwd: 'app',
  dest: 'dist',
  tmp: '.tmp',
{%- if props.htmlPreprocessor == 'jade' %}
  index: 'index.jade',
  views: '{,modules/*/}views/**/*.jade',
{%- else %}
  index: 'index.html',
  views: '{,modules/*/}views/**/*.html',
{%- endif %}
  scripts: '{,modules/*/}scripts/**/*.js',
  styles: '{,modules/*/}styles/{,*/}*.less',
  images: '{,modules/*/}images/{,*/}*.{jpg,png,svg}',
  fonts: '{,modules/*/}fonts/{,*/}*.woff',
  config: 'config/*.json',
  data: 'data/{,*/}*.json'
};

var banner = gutil.template('/**\n' +
  ' * <%= pkg.name %>\n' +
  ' * @version v<%= pkg.version %> - <%= today %>\n' +
  ' * @link <%= pkg.homepage %>\n' +
  ' * @author <%= pkg.author.name %> (<%= pkg.author.email %>)\n' +
  ' * @license {{ props.license }} License, http://www.opensource.org/licenses/{{ props.license }}\n' +
  ' */\n', {file: '', pkg: pkg, today: new Date().toISOString().substr(0, 10)});


// CLEAN
//
var clean = require('gulp-clean');
gulp.task('clean:tmp', function() {
  return gulp.src(['.tmp/*'], {read: false})
    .pipe(clean());
});
gulp.task('clean:test', function() {
  return gulp.src(['test/.tmp/*', 'test/coverage/*'], {read: false})
    .pipe(clean());
});
gulp.task('clean:dist', function() {
  return gulp.src(['.tmp/*', src.dest + '/*'], {read: false})
    .pipe(clean());
});


// CONNECT
//
var connect = require('gulp-connect');
gulp.task('connect:src', function() {
  connect.server({
    root: ['.tmp', '.dev', src.cwd],
    port: 9000,
    livereload: true
  });
});
gulp.task('connect:dist', function() {
  connect.server({
    root: [src.dest],
    port: 8080,
  });
});
var chrome = require('gulp-open');
gulp.task('open:src', function(){
  gulp.src(src.index, {cwd: src.cwd})
  .pipe(chrome('', {url: 'http://localhost:' + 9000}));
});
gulp.task('open:dist', function(){
  gulp.src(src.index, {cwd: src.cwd})
  .pipe(chrome('', {url: 'http://localhost:' + 8080}));
});


// WATCH
//
var watch = require('gulp-watch');
gulp.task('watch:src', function() {
  watch(src.scripts, {cwd: src.cwd}, function(files) {
    return gulp.start('scripts:src');
  });
  watch(src.styles.replace('{,*/}', '**/'), {cwd: src.cwd}, function(files) {
    return gulp.start('styles:src');
  });
  watch([src.index, src.views], {cwd: src.cwd}, function(files) {
    return gulp.start('views:src');
  });
});


// SCRIPTS
//
var uglify = require('gulp-uglify');
var ngAnnotate = require('gulp-ng-annotate');
gulp.task('scripts:src', function() {
  return gulp.src(src.scripts, {cwd: src.cwd, base: src.cwd})
    // .pipe(changed(src.tmp));
    .pipe(connect.reload());
});
gulp.task('scripts:dist', function() {
  return gulp.src(src.scripts, {cwd: src.cwd})
    .pipe(sourcemaps.init())
    .pipe(concat.scripts(pkg.name + '.js'))
    .pipe(ngAnnotate())
    // jshint camelcase: false
    .pipe(uglify({output: {beautify: true, indent_level: 2}, mangle: false, compress: false}))
    .pipe(concat.header(banner))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(src.dest))
    .pipe(uglify())
    .pipe(concat.header(banner))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(src.dest));
});


// STYLES
//
{% if props.cssPreprocessor == 'less' -%}
var less = require('gulp-less');
var autoprefixer = require('gulp-autoprefixer');
gulp.task('styles:src', function() {
  gulp.src(src.styles, {cwd: src.cwd, base: src.cwd})
    .pipe(changed(src.tmp))
    .pipe(plumber())
    .pipe(less())
    .pipe(autoprefixer('last 1 version'))
    .pipe(plumber.stop())
    .pipe(gulp.dest(src.tmp))
    .pipe(connect.reload());
});
// The styles:dist is proxied to usemin
// hence the dest path and the missing minification
gulp.task('styles:dist', function() {
  return gulp.src(src.styles, {cwd: src.cwd})
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(autoprefixer('last 1 version')) // , '> 1%', 'ie 8'
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.join(src.tmp, 'styles')));
});
{% else -%}
var prefix = require('gulp-autoprefixer');
gulp.task('styles:src', function() {
  gulp.src(src.styles, {cwd: src.cwd, base: src.cwd})
    .pipe(changed(src.tmp))
    .pipe(plumber())
    .pipe(autoprefixer('last 1 version'))
    .pipe(plumber.stop())
    .pipe(gulp.dest(src.tmp))
    .pipe(connect.reload());
});
gulp.task('styles:dist', function() {
  return gulp.src(src.styles, {cwd: src.cwd})
    .pipe(sourcemaps.init())
    .pipe(autoprefixer('last 1 version')) // , '> 1%', 'ie 8'
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.join(src.tmp, 'styles')));
});
{%- endif %}


// VIEWS
//
{% if props.htmlPreprocessor == 'jade' -%}
var jade = require('gulp-jade');
var wiredep = require('wiredep').stream;
var through2 = require('through2');
var usemin = require('gulp-usemin');
gulp.task('views:src', function() {

  var jadeFilter = filter('**/*.jade');
  var views = gulp.src(src.views, {cwd: src.cwd, base: src.cwd})
    .pipe(changed(src.tmp))
    .pipe(plumber())
    .pipe(jadeFilter)
    .pipe(jade({pretty: true}))
    .pipe(jadeFilter.restore())
    .pipe(plumber.stop())
    .pipe(gulp.dest(src.tmp))
    .pipe(connect.reload());

  var index = gulp.src(src.index, {cwd: src.cwd, base: src.cwd})
    .pipe(changed(src.tmp))
    .pipe(plumber())
    .pipe(jade({pretty: true}))
    .pipe(plumber.stop())
    .pipe(wiredep({directory: 'app/bower_components', exclude: [/jquery/, /js\/bootstrap/]}))
    .pipe(gulp.dest(src.tmp))
    .pipe(connect.reload());

  return merge(views, index);

});
var ngtemplate = require('gulp-ngtemplate');
var uglify = require('gulp-uglify');
var ngAnnotate = require('gulp-ng-annotate');
var htmlmin = require('gulp-htmlmin');
var nginclude = require('gulp-nginclude');
var cleancss = require('gulp-cleancss');
gulp.task('views:dist', function() {

  var jadeFilter = filter('**/*.jade');
  var views = gulp.src(src.views, {cwd: src.cwd, base: src.cwd})
    .pipe(jadeFilter)
    .pipe(jade({pretty: true}))
    .pipe(jadeFilter.restore())
    .pipe(htmlmin({removeComments: true, collapseWhitespace: true}))
    .pipe(ngtemplate({module: '{{ props.moduleName }}'}))
    .pipe(ngAnnotate())
    .pipe(concat.scripts('views.tpl.js'))
    .pipe(concat.header(banner))
    .pipe(gulp.dest(path.join(src.dest, 'scripts')))
    .pipe(rename(function(path) { path.extname = '.min.js'; }))
    .pipe(uglify({outSourceMap: false}))
    .pipe(concat.header(banner))
    .pipe(gulp.dest(path.join(src.dest, 'scripts')));

  var indexFilter = filter('index.html');
  var index = gulp.src(src.index, {cwd: src.cwd, base: src.cwd})
    .pipe(jade({pretty: true}))
    // Embed static ngIncludes
    .pipe(nginclude({assetsDirs: [src.tmp]}))
    .pipe(wiredep({directory: 'app/bower_components', exclude: [/jquery/, /js\/bootstrap/]}))
    // Append compiled views
    .pipe(through2.obj(function(file, encoding, next) {
      file.contents = new Buffer(file.contents.toString().replace(/<\/body>/, '  \n<script src="scripts/views.tpl.min.js"></script>\n\n</body>'));
      next(null, file);
    }))
    .pipe(nginclude({assetsDirs: [src.cwd]}))
    .pipe(usemin({
      js: [ngAnnotate(), concat.header(banner)],
      css: [cleancss(), concat.header(banner)],
      libs: [through2.obj(function(file, encoding, next) {
        if(file.path.match(/\.min\.js$/)) return next(null, file);
        file.path = file.path.replace(/(?!\.min)\.js$/, '.min.js');
        try {
          file.contents = fs.readFileSync(file.path).replace(/\n\/\/# sourceMappingURL=.+?$/, '');
          next(null, file);
        } catch(err) {
          next(null, file);
        }
      }), 'concat'],
    }))
    .pipe(indexFilter)
    .pipe(htmlmin({removeComments: true, collapseWhitespace: true}))
    .pipe(indexFilter.restore())
    .pipe(gulp.dest(src.dest));

  return merge(views, index);

});
{% else -%}
var wiredep = require('wiredep').stream;
var through2 = require('through2');
var usemin = require('gulp-usemin');
gulp.task('views:src', function() {

  var views = gulp.src(src.views, {cwd: src.cwd, base: src.cwd})
    .pipe(changed(src.tmp))
    .pipe(connect.reload());

  var index = gulp.src(src.index, {cwd: src.cwd, base: src.cwd})
    .pipe(changed(src.tmp))
    .pipe(wiredep({directory: 'app/bower_components', exclude: [/jquery/, /js\/bootstrap/]}))
    .pipe(gulp.dest(src.tmp))
    .pipe(connect.reload());

  return merge(views, index);

});
var ngtemplate = require('gulp-ngtemplate');
var uglify = require('gulp-uglify');
var ngAnnotate = require('gulp-ng-annotate');
var htmlmin = require('gulp-htmlmin');
var nginclude = require('gulp-nginclude');
var cleancss = require('gulp-cleancss');
gulp.task('views:dist', function() {

  var views = gulp.src(src.views, {cwd: src.cwd, base: src.cwd})
    .pipe(htmlmin({removeComments: true, collapseWhitespace: true}))
    .pipe(ngtemplate({module: '{{ props.moduleName }}'}))
    .pipe(ngAnnotate())
    .pipe(concat.scripts('views.tpl.js'))
    .pipe(concat.header(banner))
    .pipe(gulp.dest(path.join(src.dest, 'scripts')))
    .pipe(rename(function(path) { path.extname = '.min.js'; }))
    .pipe(uglify({outSourceMap: false}))
    .pipe(concat.header(banner))
    .pipe(gulp.dest(path.join(src.dest, 'scripts')));

  var indexFilter = filter('index.html');
  var index = gulp.src(src.index, {cwd: src.cwd, base: src.cwd})
    .pipe(wiredep({directory: 'app/bower_components', exclude: [/jquery/, /js\/bootstrap/]}))
    // Append compiled views
    .pipe(through2.obj(function(file, encoding, next) {
      file.contents = new Buffer(file.contents.toString().replace(/<\/body>/, '  \n<script src="scripts/views.tpl.min.js"></script>\n\n</body>'));
      next(null, file);
    }))
    // Embed static ngIncludes
    .pipe(nginclude({assetsDirs: [src.cwd, src.tmp]}))
    .pipe(usemin({
      js: [ngAnnotate(), concat.header(banner)],
      css: [cleancss(), concat.header(banner)],
      libs: [through2.obj(function(file, encoding, next) {
        if(file.path.match(/\.min\.js$/)) return next(null, file);
        file.path = file.path.replace(/(?!\.min)\.js$/, '.min.js');
        try {
          file.contents = fs.readFileSync(file.path).replace(/\n\/\/# sourceMappingURL=.+?$/, '');
          next(null, file);
        } catch(err) {
          next(null, file);
        }
      }), 'concat'],
    }))
    .pipe(indexFilter)
    .pipe(htmlmin({removeComments: true, collapseWhitespace: true}))
    .pipe(indexFilter.restore())
    .pipe(gulp.dest(src.dest));

  return merge(views, index);

});
{%- endif %}

// TEST
//
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
gulp.task('jshint', function() {
  gulp.src(src.scripts, {cwd: src.cwd})
    .pipe(changed(src.scripts))
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});
var karma = require('karma').server;
gulp.task('karma:unit', function() {
  karma.start({
    configFile: path.join(__dirname, 'test/karma.conf.js'),
    browsers: ['PhantomJS'],
    reporters: ['dots'],
    singleRun: true
  }, function(code) {
    gutil.log('Karma has exited with ' + code);
    process.exit(code);
  });
});
gulp.task('karma:server', function() {
  karma.start({
    configFile: path.join(__dirname, 'test/karma.conf.js'),
    browsers: ['PhantomJS'],
    reporters: ['progress'],
    autoWatch: true
  }, function(code) {
    gutil.log('Karma has exited with ' + code);
    process.exit(code);
  });
});


// COPY
//
gulp.task('copy:dist', function() {
  gulp.src(['bower_components/font-awesome/fonts/*.woff'], {cwd: src.cwd})
    .pipe(gulp.dest(path.join(src.dist, 'fonts')));
  gulp.src(['favicon.ico', src.images, src.fonts, src.config, 'modules/**/*.tpl.html'], {cwd: src.cwd, base: src.cwd})
    .pipe(gulp.dest(src.dist));
});

// ALIASES
//
var runSequence = require('run-sequence');
gulp.task('default', ['build']);
gulp.task('dist', ['build']);
gulp.task('test', function() {
  runSequence('clean:test', ['jshint', 'karma:unit']);
});
gulp.task('build', function() {
  runSequence('clean:dist', ['views:src', 'styles:dist'], ['views:dist', 'copy:dist']);
});
gulp.task('serve', function() {
  runSequence('clean:tmp', ['views:src', 'styles:src', 'connect:src'], ['open:src', 'watch:src']);
});
gulp.task('serve:dist', ['connect:dist', 'open:dist']);
gulp.task('serve:dist', ['connect:dist', 'open:dist']);
