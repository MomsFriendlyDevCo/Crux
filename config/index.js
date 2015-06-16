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
	defaults,
	fs.existsSync('./config/private.js') ? require('./private.js') : {},
	fs.existsSync('./config/' + defaults.env + '.js') ? require('./' + defaults.env + '.js') : {}
);
