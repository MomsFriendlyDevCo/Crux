var _ = require('lodash');
var gulp = require('gulp');
var gutil = require('gulp-util');
var notify = require('gulp-notify');
var requireDir = require('require-dir');

// Configure / Plugins {{{
requireDir('./gulp-tasks');
notify.logLevel(0);
// }}}

// Configure / Paths {{{
global.paths = {
	ignore: [ // Do not monitor these paths for changes
		'app/', // No need to watch this with nodemon as its handled seperately
		'views/partials',
		'bower_components/',
		'node_modules/',
		'build/',
		'data/',
		'test/',
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
gulp.task('db', ['scenario']);
gulp.task('fakes', ['fake-users']);
gulp.task('deploy', ['pm2-deploy']);
gulp.task('start', ['pm2-start']);
gulp.on('stop', function() { process.exit(0) });
// }}}

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

/**
* Launch a plain server without Nodamon
*/
gulp.task('server', ['build'], function() {
	require('./server.js');
});
// }}}
