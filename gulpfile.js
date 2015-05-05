var _ = require('lodash');
var concat = require('gulp-concat');
var del = require('del');
var exec = require('child_process').exec;
var gulp = require('gulp');
var gutil = require('gulp-util');
var ngmin = require('gulp-ngmin');
var notify = require('gulp-notify');
var nodemon = require('gulp-nodemon');
var replace = require('gulp-replace');
var requireDir = require('require-dir');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');

// Configure / Plugins {{{
requireDir('./gulp-tasks');
notify.logLevel(0);
// }}}

// Configure / Paths {{{
global.paths = {
	ignore: [ // Do not monitor these paths for changes
		'app/', // Updates caught by gulp-watch within 'nodemon' task anyway
		'bower_components/',
		'node_modules/',
		'build/',
		'data/',
	],
	scripts: [
		'app/**/*.js',
	],
	css: [
		'public/css/**/*.css',
	],
	data: [
		'models/data/**/*.js'
	],
	scenarios: [
		'models/scenarios/**/*.json',
	],
	build: 'build',
};
// }}}

// Redirectors {{{
gulp.task('default', ['nodemon']);
gulp.task('build', ['scripts', 'css']);
gulp.task('db', ['scenario'], process.exit);
gulp.task('deploy', ['af-deploy']);

// Loaders {{{
gulp.task('load:config', [], function(finish) {
	global.config = require('./config');
	finish();
});

gulp.task('load:db', ['load:config'], function(finish) {
	require('./config/db');
	finish();
});

gulp.task('load:models', ['load:db'], function(finish) {
	require('./models');
	finish();
});
// }}}

// Custom tasks for this project {{{
/**
* Compile all JS files into the build directory
*/
gulp.task('scripts', ['load:config'], function() {
	return gulp.src(paths.scripts)
		.pipe(sourcemaps.init())
		.pipe(concat('site.min.js'))
		.pipe(replace("\"app\/", "\"\/app\/")) // Rewrite all literal paths to relative ones
		.pipe(ngmin())
		.pipe(uglify({mangle: false}))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(paths.build))
		.pipe(notify({message: 'Rebuilt frontend scripts', title: config.title}));
});


/**
* Compile all CSS files into the build directory
*/
gulp.task('css', ['load:config'], function() {
	return gulp.src(paths.css)
		.pipe(sourcemaps.init())
		.pipe(concat('site.min.css'))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(paths.build))
		.pipe(notify({message: 'Rebuilt frontend CSS', title: config.title}));
});


/**
* Wipe all generated files
*/
gulp.task('clean', function(next) {
	del('./data/*', next)
});


/**
* Launch a plain server without Nodamon
*/
gulp.task('server', ['build'], function() {
	require('./server.js');
});
// }}}
