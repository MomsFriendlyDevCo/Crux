var _ = require('lodash');
var gulp = require('gulp');
var gutil = require('gulp-util');
var notify = require('gulp-notify');
var requireDir = require('require-dir');
var runSequence = require('run-sequence');

// Configure / Plugins {{{
requireDir('./gulp-tasks');
notify.logLevel(0);
// }}}

// Configure / Paths {{{
// All paths should be relative to the project root directory
global.paths = {
	root: __dirname + '/', // Root directory of the project
	ignore: [ // Do not monitor these paths for changes
		'app/', // No need to watch this with nodemon as its handled seperately
		'views/partials',
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
	partials: [
		'views/partials/**/*.html',
	],
	data: [
		'models/data/**/*.js'
	],
	scenarios: [
		'models/scenarios/**/*.json',
	],
	build: 'build',
	vendors: [
		// Vendor dependencies (all must follow the protocol://path format)
		// Dependencies maintain order so list pre-requisites first
		// Do not include minified files here! Minification happens automatically
		'node_modules/jquery/dist/jquery.js',
		'node_modules/angular/angular.js',
		'node_modules/lodash/lodash.js',
		'node_modules/moment/moment.js',
		// --- less important vendors below this line --- //
		'node_modules/bootstrap/dist/css/bootstrap.css',
		'node_modules/bootstrap/dist/js/bootstrap.js',
		'node_modules/angular-bs-confirm/angular-bs-confirm.js',
		'node_modules/angular-bs-tooltip/angular-bs-tooltip.js',
		'node_modules/angular-gravatar/build/angular-gravatar.js',
		'node_modules/angular-ui-notification/dist/angular-ui-notification.css',
		'node_modules/angular-ui-notification/dist/angular-ui-notification.js',
		'node_modules/angular-resource/angular-resource.js',
		'node_modules/angular-ui-router/release/angular-ui-router.js',
		'node_modules/angular-ui-switch/angular-ui-switch.css',
		'node_modules/angular-ui-switch/angular-ui-switch.js',
		'node_modules/font-awesome/css/font-awesome.css', // NOTE: Font files are handled in controllers/vendors.js
	],
};
// }}}

// Redirectors {{{
gulp.task('default', ['serve']);
gulp.task('clean', ['scripts:clean']);
gulp.task('db', ['scenario']);
gulp.task('fakes', ['fake-users']);
gulp.task('deploy', ['pm2-deploy']);
gulp.task('serve', ['nodemon']);
gulp.task('start', ['pm2-start']);
gulp.on('stop', function() { process.exit(0) });

gulp.task('build', function(finish) {
	runSequence(
		['css', 'partials', 'scripts', 'vendors'],
		finish
	);
});
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
