// Generated on <%= (new Date).toISOString().split('T')[0] %> using <%= pkg.name %> <%= pkg.version %>
'use strict';

var gulp = require('gulp');
var path = require('path');
var util = require('util');
var gutil = require('gulp-util');
var changed = require('gulp-changed');
var rename = require('gulp-rename');
var pkg = require('./package.json');
var fs = require('fs');

var paths = {
  src: 'app',
  dist: 'dist',
  tmp: '.tmp',
  scripts: 'scripts/**/*.js',
  index: 'index.html',
  views: 'views/**/*.html',
  images: 'images/{,*/}*.{jpg,png,svg}',
  styles: 'styles/{,*/}*.less',
  fonts: 'fonts/{,*/}*.woff',
  data: 'data/{,*/}*.json'
};

var banner = gutil.template('/**\n' +
  ' * <%%= pkg.name %>\n' +
  ' * @version v<%%= pkg.version %> - <%%= today %>\n' +
  ' * @link <%%= pkg.homepage %>\n' +
  ' * @author <%%= pkg.author.name %> (<%%= pkg.author.email %>)\n' +
  ' * @license <%= props.license %> License, http://www.opensource.org/licenses/<%= props.license %>\n' +
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
  return gulp.src(['.tmp/*', paths.dist + '/*'], {read: false})
    .pipe(clean());
});


// CONNECT
//
var connect = require('gulp-connect');
gulp.task('connect:src', function() {
  connect.server({
    root: ['.tmp', '.dev', paths.src],
    port: 9000,
    livereload: true
  });
});
gulp.task('connect:dist', function() {
  connect.server({
    root: [paths.dist],
    port: 8080,
  });
});
var chrome = require('gulp-open');
gulp.task('open:src', function(){
  gulp.src(paths.index, {cwd: paths.src})
  .pipe(chrome('', {url: 'http://localhost:' + 9000}));
});
gulp.task('open:dist', function(){
  gulp.src(paths.index, {cwd: paths.src})
  .pipe(chrome('', {url: 'http://localhost:' + 8080}));
});


// WATCH
//
var watch = require('gulp-watch');
gulp.task('watch:src', function() {
  gulp.src(paths.scripts, {cwd: paths.src})
    .pipe(watch(function(files) {
      return files.pipe(connect.reload());
    }));
  gulp.src(paths.styles, {cwd: paths.src})
    .pipe(watch({}, ['styles:src']));
  gulp.src([paths.index, paths.views], {cwd: paths.src})
    .pipe(watch({}, ['views:src']));
});


// SCRIPTS
//
var uglify = require('gulp-uglify');
var ngmin = require('gulp-ngmin');
var concat = require('gulp-concat-util');
gulp.task('scripts:dist', function() {
  gulp.src(paths.scripts, {cwd: paths.src})
    .pipe(ngmin())
    .pipe(concat(pkg.name + '.js', {process: function(src) { return '// Source: ' + path.basename(this.path) + '\n' + (src.trim() + '\n').replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1'); }}))
    .pipe(concat.header('(function(window, document, undefined) {\n\'use strict\';\n'))
    .pipe(concat.footer('\n})(window, document);\n'))
    .pipe(concat.header(banner))
    .pipe(gulp.dest(paths.dist))
    .pipe(rename(function(path) { path.extname = '.min.js'; }))
    .pipe(uglify({outSourceMap: true}))
    .pipe(concat.header(banner))
    .pipe(gulp.dest(paths.dist));
});


// STYLES
//
<% if (props.cssPreprocessor === 'less') { %>var less = require('gulp-less');
var prefix = require('gulp-autoprefixer');
var combine = require('stream-combiner');
var chalk = require('chalk');
gulp.task('styles:src', function() {
  var safeLess = combine(less());
  safeLess.on('error', function(err) {
    gutil.log(chalk.red(util.format('Plugin error: %s', err.message)));
  });
  return gulp.src(paths.styles, {cwd: paths.src, base: paths.src})
    .pipe(changed(paths.tmp))
    .pipe(safeLess)
    .pipe(prefix('last 1 version'))
    .pipe(gulp.dest(paths.tmp))
    .pipe(connect.reload());
});
gulp.task('styles:dist', function() {
  return gulp.src(paths.styles, {cwd: paths.src, base: paths.src})
    .pipe(less())
    .pipe(prefix('last 1 version', '> 1%', 'ie 8'))
    .pipe(gulp.dest(paths.tmp));
});<% } else { %>var prefix = require('gulp-autoprefixer');
gulp.task('styles:src', function() {
  return gulp.src(paths.styles, {cwd: paths.src, base: paths.src})
    .pipe(changed(paths.tmp))
    .pipe(prefix('last 1 version'))
    .pipe(gulp.dest(paths.tmp))
    .pipe(connect.reload());
});
gulp.task('styles:dist', function() {
  return gulp.src(paths.styles, {cwd: paths.src, base: paths.src})
    .pipe(prefix('last 1 version', '> 1%', 'ie 8'))
    .pipe(gulp.dest(paths.tmp));
});<% } %>


// VIEWS
//
<% if (props.htmlPreprocessor === 'jade') { %>var jade = require('gulp-jade');
var wiredep = require('wiredep').stream;
var through2 = require('through2');
var merge = require('merge-stream');
var usemin = require('gulp-usemin');
gulp.task('views:src', function() {

  var combined = combine(
    // views
    gulp.src(paths.views, {cwd: paths.src, base: paths.src})
      .pipe(changed(paths.tmp))
      .pipe(jade({pretty: true}))
      .pipe(gulp.dest(paths.tmp))
      .pipe(connect.reload()),
    // index
    gulp.src(paths.index, {cwd: paths.src, base: paths.src})
      .pipe(changed(paths.tmp))
      .pipe(jade({pretty: true}))
      .pipe(through2.obj(function(file, encoding, next) {
        // Fake path for wiredep
        file.path = path.join(__dirname, paths.src, 'index.html');
        file.base = path.dirname(file.path);
        next(null, file);
      }))
      .pipe(wiredep({directory: 'app/bower_components', exclude: [/jquery/, /js\/bootstrap/]}))
      .pipe(gulp.dest(paths.tmp))
      .pipe(connect.reload())
  );

  combined.on('error', function(err) {
    gutil.log(chalk.red(util.format('Plugin error: %s', err.message)));
  });

  return combined;
});
var ngtemplate = require('gulp-ngtemplate');
var uglify = require('gulp-uglify');
var ngmin = require('gulp-ngmin');
var htmlmin = require('gulp-htmlmin');
var nginclude = require('gulp-nginclude');
var cleancss = require('gulp-cleancss');
gulp.task('views:dist', function() {

  var combined = combine(
    // views
    gulp.src(paths.views, {cwd: paths.src, base: paths.src})
      .pipe(jade({pretty: true}))
      .pipe(htmlmin({removeComments: true, collapseWhitespace: true}))
      .pipe(ngtemplate({module: pkg.name}))
      .pipe(ngmin())
      .pipe(concat('views.tpl.js', {process: function(src) { return '// Source: ' + path.basename(this.path) + '\n' + (src.trim() + '\n').replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1'); }}))
      .pipe(concat.header('(function(window, document, undefined) {\n\'use strict\';\n\n'))
      .pipe(concat.footer('\n\n})(window, document);\n'))
      .pipe(concat.header(banner))
      // .pipe(gulp.dest(path.join(paths.dist, 'scripts')))
      .pipe(rename(function(path) { path.extname = '.min.js'; }))
      .pipe(uglify({outSourceMap: false}))
      .pipe(concat.header(banner))
      .pipe(gulp.dest(path.join(paths.dist, 'scripts'))),
    // index
    gulp.src(paths.index, {cwd: paths.src, base: paths.src})
      .pipe(jade({pretty: true}))
      .pipe(nginclude({assetsDirs: [paths.tmp]}))
      .pipe(through2.obj(function(file, encoding, next) {
        // Fake path for wiredep
        file.path = path.join(__dirname, paths.src, 'index.html');
        file.base = path.dirname(file.path);
        next(null, file);
      }))
      .pipe(wiredep({directory: 'app/bower_components', exclude: [/jquery/, /js\/bootstrap/]}))
      .pipe(through2.obj(function(file, encoding, next) {
        file.contents = new Buffer(file.contents.toString().replace(/<\/body>/, '  \n<script src="scripts/views.tpl.min.js"></script>\n\n</body>'));
        next(null, file);
      }))
      .pipe(nginclude({assetsDirs: [paths.src]}))
      .pipe(usemin({
        js: [ngmin(), uglify(), concat.header(banner)],
        css: [cleancss(), concat.header(banner)],
        libs: [through2.obj(function(file, encoding, next) {
          if(file.path.match(/\.min\.js$/)) return next(null, file);
          file.path = file.path.replace(/(?!\.min)\.js$/, '.min.js');
          file.contents = fs.readFileSync(file.path);
          next(null, file);
        }), 'concat'],
      }))
      .pipe(htmlmin({removeComments: true, collapseWhitespace: true}))
      .pipe(gulp.dest(paths.dist))
  );

  combined.on('error', function(err) {
    gutil.log(chalk.red(util.format('Plugin error: %s', err.message)));
  });

  return combined;

});<% } else { %>var combine = require('stream-combiner');
var wiredep = require('wiredep').stream;
var through2 = require('through2');
gulp.task('views:src', function() {

  var combined = combine(
    // views
    gulp.src(paths.views, {cwd: paths.src, base: paths.src})
      .pipe(changed(paths.tmp))
      .pipe(connect.reload()),
    // index
    gulp.src(paths.index, {cwd: paths.src, base: paths.src})
      .pipe(changed(paths.tmp))
      .pipe(wiredep({directory: 'app/bower_components', exclude: [/jquery/, /js\/bootstrap/]}))
      .pipe(gulp.dest(paths.tmp))
      .pipe(connect.reload())
  );

  combined.on('error', function(err) {
    gutil.log(chalk.red(util.format('Plugin error: %s', err.message)));
  });

  return combined;

});
var usemin = require('gulp-usemin');
var ngtemplate = require('gulp-ngtemplate');
var uglify = require('gulp-uglify');
var ngmin = require('gulp-ngmin');
var htmlmin = require('gulp-htmlmin');
var nginclude = require('gulp-nginclude');
var cleancss = require('gulp-cleancss');
gulp.task('views:dist', function() {

  var combined = combine(
    // views
    gulp.src(paths.views, {cwd: paths.src, base: paths.src})
      .pipe(htmlmin({removeComments: true, collapseWhitespace: true}))
      .pipe(ngtemplate({module: pkg.name}))
      .pipe(ngmin())
      .pipe(concat('views.tpl.js', {process: function(src) { return '// Source: ' + path.basename(this.path) + '\n' + (src.trim() + '\n').replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1'); }}))
      .pipe(concat.header('(function(window, document, undefined) {\n\'use strict\';\n\n'))
      .pipe(concat.footer('\n\n})(window, document);\n'))
      .pipe(concat.header(banner))
      .pipe(rename(function(path) { path.extname = '.min.js'; }))
      .pipe(uglify({outSourceMap: false}))
      .pipe(concat.header(banner))
      .pipe(gulp.dest(path.join(paths.dist, 'scripts'))),
    // index
    gulp.src(paths.index, {cwd: paths.src, base: paths.src})
      .pipe(wiredep({directory: 'app/bower_components', exclude: [/jquery/, /js\/bootstrap/]}))
      .pipe(nginclude({assetsDirs: [paths.tmp]}))
      .pipe(through2.obj(function(file, encoding, next) {
        file.contents = new Buffer(file.contents.toString().replace(/<\/body>/, '  \n<script src="scripts/views.tpl.min.js"></script>\n\n</body>'));
        next(null, file);
      }))
      .pipe(usemin({
        js: [ngmin(), uglify(), concat.header(banner)],
        css: [cleancss(), concat.header(banner)],
        libs: [through2.obj(function(file, encoding, next) {
          if(file.path.match(/\.min\.js$/)) return next(null, file);
          file.path = file.path.replace(/(?!\.min)\.js$/, '.min.js');
          file.contents = fs.readFileSync(file.path);
          next(null, file);
        }), 'concat'],
      }))
      .pipe(htmlmin({removeComments: true, collapseWhitespace: true}))
      .pipe(gulp.dest(paths.dist))
  );

  combined.on('error', function(err) {
    gutil.log(chalk.red(util.format('Plugin error: %s', err.message)));
  });

  return combined;

});<% } %>


// TEST
//
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
gulp.task('jshint', function() {
  gulp.src(paths.scripts, {cwd: paths.src})
    .pipe(changed(paths.scripts))
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
  // gulp.src(['bower_components/font-awesome/fonts/*.woff'], {cwd: paths.src})
  //   .pipe(gulp.dest(path.join(paths.dist, 'fonts')));
  gulp.src(['favicon.ico', paths.images, paths.fonts, 'modules/**/*.tpl.html'], {cwd: paths.src, base: paths.src})
    .pipe(gulp.dest(paths.dist));
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
