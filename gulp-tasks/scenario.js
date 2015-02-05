var gulp = require('gulp');
var gutil = require('gulp-util');
var scenario = require('gulp-mongoose-scenario');

/**
* Setup the local Mongo DB with all the files located in paths.data
*/
gulp.task('db', ['clean'], function(next) {
	global.config = require('../config');
	require('../config/db');
	require('../models');

	gulp.src('models/scenarios/setup.json')
		.pipe(scenario({connection: db, nuke: true}))
		.on('error', function(err) {
			gutil.log('Error loading scenario'.red, err);
		})
		.on('end', process.exit)
});
