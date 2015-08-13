var runSequence = require('run-sequence');
/**
* User friendly function to compile + upload + wait for finish of a PhoneGap application
*/
gulp.task('pg', [], function(next) {
	runSequence(
		'bump',
		'pgpush',
		'pgclean',
		'pgwait',
		next
	);
});

/**
* Cleans the PhoneGap build
*/
gulp.task('pgclean', [], function(next) {
	gutil.log('Cleaning PhoneGap build...');
	del([paths.phoneGap.buildDir,
		 paths.products.scenario,
		 paths.products.gallery], next);
});

/**
* Compiles the PhoneGap ZIP object to be uploaded
*/
gulp.task('pgbuild', ['scripts:templateCache', 'pgclean'], function(finish) {
	var config = require('./config');

	async()
		.then(function(next) {
			gutil.log('Making directory structure for PhoneGap...');
			mkdirp(paths.phoneGap.buildDir + '/build', next);
		})
		.then(function(next) {
			// Bulid + template the config.xml file from the projects config
			gutil.log('Building config.xml v', config.package.version.cyan, '...');
			fs.readFile('config.xml', function(err, data) {
				var outConfigXML = _.template(data, config);
				fs.writeFile(paths.phoneGap.buildDir + '/config.xml', outConfigXML, next);
			});
		})
		.then(function(next) {
			gutil.log('Downloading main site page...');

			run('wget -q -r -l inf --no-host-directories "' + config.url + '"', {cwd: paths.phoneGap.buildDir, ignoreFail: true}, next);
		})
		.then(function(next) {
			gutil.log('Rewriting all links in HTML files...');
			gulp.src(paths.phoneGap.buildDir + '/index.html')
				.pipe(plugins.replace(/(href|src)=(["'])\//g, '$1=$2')) // Rewrite all root paths to relative ones
				.pipe(gulp.dest(paths.phoneGap.buildDir))
				.on('end', next);
		})
		.then(function(next) {
			gutil.log('Copying other assets...');

			gutil.log(' * Images');
			gulp.src('public/img/**')
				.pipe(gulp.dest('build/phonegap/img'))
				.on('end', next);
		})
		// Fixes {{{
		.then(function(next) {
			gutil.log('Applying fixes...');
			next();
		})
		.then(function(next) {
			/**
			* Fixes the *&^%$ annoying bug where Fontawesome sticks '?v=4.1.0' at the end of file names in both CSS and the files on disk
			* This REALLY upsets PhoneGap so we need to change the original CSS + the file names on disk
			*/
			gutil.log(' * Mobile-Angular-UI / FontAwesome using ?v=x bug');
			gulp.src(paths.phoneGap.buildDir + '/bower_components/mobile-angular-ui/dist/css/mobile-angular-ui-base.min.css')
				.pipe(plugins.replace(/(fontawesome-webfont\.(eot|woff|ttf|svg)).*?\)/g, '$1)'))
				.pipe(gulp.dest(paths.phoneGap.buildDir + '/bower_components/mobile-angular-ui/dist/css'))
				.on('end', function() {
					// Delete auto completed directory
					del(paths.phoneGap.buildDir + '/bower_components/mobile-angular-ui/dist/fonts', function() {
						gulp.src('bower_components/mobile-angular-ui/dist/fonts/*') // Copy from known good directory
							.pipe(gulp.dest(paths.phoneGap.buildDir + '/bower_components/mobile-angular-ui/dist/fonts'))
							.on('end', next);
					});
				});
			next();
		})
		// }}}
		.then(function(next) {
			fs.exists(paths.phoneGap.zip, function(exists) {
				if (exists) {
					gutil.log('Deleting existing ZIP...');
					fs.unlink(paths.phoneGap.zip, next);
				} else
					next();
			});
		})
		.then(function(next) {
			gutil.log('Compressing into ZIP...');
			run("zip -qr '" + paths.phoneGap.zipRelative + "' *", {cwd: paths.phoneGap.buildDir}, next);
		})
		.then(function(next) {
			fs.stat(paths.phoneGap.zip, function(err, stat) {
				gutil.log('Done, ZIP size:', stat.size.toString().cyan, 'bytes');
				next();
			});
		})
		.end(finish);
});

/**
* Compiles + uploads the latest ZIP image to the PhoneGap Build service
*/
gulp.task('pgpush', ['pgbuild'], function(next) {
	var config = require('./config');
	gutil.log('Uploading ZIP image...');

	superagent
		.put('https://build.phonegap.com/api/v1/apps/' + config.phonegap.appId)
		.auth(config.phonegap.username, config.phonegap.password)
		.attach('file', paths.phoneGap.zip)
		.end(function(err, res) {
			if (res.status == '200') {
				gutil.log('Zip image uploaded');
				next();
			} else {
				gutil.log('Problem uploading ZIP image');
				next(err);
			}
		});
});

/**
* Retrieves the current PhoneGap Build status object from the server
*/
gulp.task('pgstatus', [], function(next) {
	var config = require('./config');
	var util = require('util');
	superagent
		.get('https://build.phonegap.com/api/v1/apps/' + config.phonegap.appId)
		.auth(config.phonegap.username, config.phonegap.password)
		.end(function(err, res) {
			gutil.log(util.inspect(res.body, {depth: 3}));
			next(err);
		});
});

/**
* Similar to `pgstatus` this task obtains the current status object and keeps checking until the android app status is compiled
*/
gulp.task('pgwait', [], function(next) {
	var config = require('./config');
	var util = require('util');
	var tryCount = 1;

	var scan = function() {
		superagent
			.get('https://build.phonegap.com/api/v1/apps/' + config.phonegap.appId)
			.auth(config.phonegap.username, config.phonegap.password)
			.end(function(err, res) {
				if (res.body.status.android == 'complete') {
					gutil.log('Android app', res.body.version.cyan, 'compiled!'.green);
					next();
				} else {
					if (tryCount == 1) {
						gutil.log('Android app', res.body.version.cyan, 'compiling...');
					} else {
						gutil.log(' * Refresh #' + tryCount.toString().cyan + '. Still compiling...');
					}
					tryCount++;
					setTimeout(scan, 2000);
				}
			});
	};
	scan();
});
