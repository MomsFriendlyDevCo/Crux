var _ = require('lodash');
var path = require('path');
var fs = require('fs');

// Determine 'ENV' {{{
var env = 'dev';
if (process.env.VCAP_SERVICES) {
	env = 'appfog';
} else if (process.env.OPENSHIFT_NODEJS_IP) {
	env = 'openshift';
} else if (process.env.MONGOLAB_URI) {
	env = 'heroku';
} else if (process.env.NODE_ENV) { // Inherit from NODE_ENV
	env = process.env.NODE_ENV;
}
// }}}

var defaults = {
	name: "{{FIXME.project.name}}",
	title: "{{FIXME.project.title}}",
	env: env,
	root: path.normalize(__dirname + '/..'),
	host: null, // Listen to all host requests
	port: process.env.PORT || 80,
	url: 'http://localhost',
	secret: "{{FIXME.random}}", // A quick way to populate this is with `cat /dev/urandom | base64`
	contactEmail: 'matt@mfdc.biz',
	gulp: {
		debugJS: true,
		minifyJS: false,
		debugCSS: true,
		minifyCSS: false,
	},
	mongo: {
		uri: 'mongodb://localhost/{{FIXME.db.name}}',
		options: {
			db: {
				safe: true
			}
		}
	},
	newrelic: {
		enabled: true,
		name: '{{FIXME.project.name}}',
		license: '{{FIXME.newrelic.license}}',
	},
};

module.exports = _.merge(
	// Adopt defaults...
	defaults,

	// Which are overriden by private.js if its present
	fs.existsSync(__dirname + '/private.js') ? require(__dirname + '/private.js') : {},

	// Whish are overriden by the NODE_ENV.js file if its present
	fs.existsSync(__dirname + '/' + defaults.env + '.js') ? require(__dirname + '/' + defaults.env + '.js') : {}
);
