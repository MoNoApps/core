// Gulp dependencies
var gulp   = require('gulp');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var mincss = require('gulp-cssnano');
var srcmap = require('gulp-sourcemaps');
var assets = require('./autoform/_assets');

// vars
var scripts = [];
var jsng = [];
var styles = [];

assets(function(a,b,c){
  scripts = a;
  jsng = b;
  styles = c;
});

gulp.task('lint', function() {
  gulp.src(scripts)
  .pipe(jshint())
  .pipe(jshint.reporter('default'));
});

gulp.task('minify', function(){
  gulp.src(jsng)
  .pipe(srcmap.init())
  .pipe(uglify())
  .pipe(concat('application.min.js'))
  .pipe(srcmap.write())
  .pipe(gulp.dest('./public/'));
});

gulp.task('styles', function() {
  gulp.src(styles)
  .pipe(concat('application.min.css'))
  .pipe(mincss())
  .pipe(gulp.dest('./public/'));
});

gulp.task('watch', function() {
  gulp.watch(scripts, ['lint']);
  gulp.watch(jsng, ['lint']);
  gulp.watch(jsng, ['minify']);
  gulp.watch(styles, ['styles']);
  gulp.watch(scripts, ['app']);
});

gulp.task('autoform', function(done) {
  var autoform = require('./autoform/index');
  autoform(done);
});

gulp.task('app', function() {
  var prt = require('./config.json').port;
  var api = require('./api/routes');
  var svr = require('./web/routes').svr;
  var sio = require('./sio/routes');

  api.listen(prt.api, function() {});
  svr.listen(prt.web, function() {});
  sio.listen(function() {});
});

// Default
gulp.task('default',[
  'watch',
  'lint',
  'minify',
  'styles',
  'autoform',
  'app'
]);
