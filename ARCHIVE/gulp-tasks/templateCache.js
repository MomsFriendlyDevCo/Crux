/**
* Spew a template file into the main JS file
* This is only really needed on mobile devices to speed up the template load time
* Its needed for PhoneGap which for some reason can't load external files for use in an ngView
*/
gulp.task('scripts:templateCache', ['scripts'], function(next) {
	var mainBuild = gulp.src('build/site.min.js');

	var templateCache = gulp.src('views/templates/**/*.html')
		.pipe(plugins.angularTemplatecache('templateCache.js', {
			root: '/templates',
			module: 'app'
		}))
		.pipe(plugins.replace(/(href|src)=(\\["'])\//g, '$1=$2')); // Rewrite all literal paths to relative ones

	var merged = mergeStream(mainBuild, templateCache)
		.pipe(plugins.concat('site.min.js'))
		.pipe(gulp.dest('build'));
	return merged;
});

