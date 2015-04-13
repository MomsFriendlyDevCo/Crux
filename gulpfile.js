var _ = require('lodash');
var concat = require('gulp-concat');
var del = require('del');
var exec = require('child_process').exec;
var gulp = require('gulp');
var gutil = require('gulp-util');
var jscs = require('gulp-jscs');
var nodemon = require('gulp-nodemon');
var replace = require('gulp-replace');
var requireDir = require('require-dir');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');

var paths = {
	ignore: [ // Do not monitor these paths for changes
		'bower_components/',
		'node_modules/',
		'build/',
		'data/',
	],
	scripts: [
		'app/**/*.js',
	],
	css: [
		'public/css/**/*.scss',
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

requireDir('./gulp-tasks');

// Redirectors
gulp.task('build', ['scripts', 'css']);
gulp.task('db', ['scenario']);
gulp.task('deploy', ['af-deploy']);

/**
* Compile all JS files into the build directory
*/
gulp.task('scripts', [], function() {
	return gulp.src(paths.scripts)
		.pipe(sourcemaps.init())
		.pipe(concat('all.min.js'))
		.pipe(uglify())
		.pipe(replace("\"app\/", "\"\/app\/")) // Rewrite all literal paths to relative ones
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(paths.build));
});

/**
* Compile all CSS/SCSS files into the build directory
*/
gulp.task('css', [], function() {
	return gulp.src(paths.css)
		.pipe(sourcemaps.init())
		.pipe(concat('all.min.css'))
		.pipe(sass())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(paths.build));
});

/**
* Run all JS files though JSCS - https://github.com/jscs-dev/node-jscs
*/
gulp.task('lint', function() {
	gulp.src(paths.scripts)
		.pipe(jscs({configPath: './.jscs.json'}))
		.pipe(gulp.dest('build'));
});

/**
* Wipe all generated files
*/
gulp.task('clean', function(next) {
	del('./data/*', next)
});

/**
* Launch a server and watch the local file system for changes (restarting the server if any are detected)
*/
gulp.task('default', ['build'], function () {
	nodemon({
		script: 'server.js',
		ext: 'html js ejs css scss',
		ignore: paths.ignore,
	})
		.on('change', ['build'])
		.on('restart', function (a,b,c) {
			gutil.log('Restarted!'.red)
		});
});

/**
* Launch a plain server without Nodamon
*/
gulp.task('server', ['build'], function() {
	require('./server.js');
});
