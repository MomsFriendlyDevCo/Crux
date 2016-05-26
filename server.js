#!/usr/bin/env node
// Initial / Config {{{
global.config = require('./config');
// }}}
// Initial / NewRelic {{{
if (config.newrelic.enabled) require('newrelic');
// }}}
// Requires {{{
var _ = require('lodash');
var colors = require('chalk');
var bodyParser = require('body-parser');
var express = require('express');
var layouts = require('express-ejs-layouts')
var fspath = require('path');
var fs = require('fs');
var requireDir = require('require-dir');
global.app = express();
// }}}
// Settings {{{
app.set('title', config.title);
app.set('view engine', "html");
app.set('layout', 'layouts/main');
app.engine('.html', require('ejs').renderFile);
app.enable('view cache');
app.use(layouts);
// }}}
// Settings / Basic Auth lockdown {{{
// Enable this to temporarily lock down the server quickly
// app.use(express.basicAuth('user', 'letmein'));

// Lookup auth details from config.access.users
if (config.access && config.access.lockdown) {
	var basicAuth = require('basic-auth-connect');
	app.use(basicAuth(function(user, pass) {
		var user = _.find(config.access.users, {user: user});
		return (user && pass == user.pass);
	}, config.title + ' - Private'));
}
// }}}
// Settings / Parsing {{{
app.use(require('cookie-parser')());
app.use(bodyParser.json({limit: '16mb'}));
app.use(bodyParser.urlencoded({limit: '16mb', extended: false}));
// }}}
// Settings / ReST (Monoxide) {{{
var monoxide = require('monoxide');
require('./config/db');
require('./models');
// }}}
// Settings / Cookies + Sessions {{{
app.use(require('connect-flash')());
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);
app.use(session({
	secret: config.secret,
	store: new mongoStore({mongooseConnection: monoxide.connection}),
	resave: false,
	saveUninitialized: false,
	cookie: {
		expires: new Date(Date.now() + (3600000 * 48)), // 48 hours
		maxAge: (3600000 * 48) // 48 hours
	}
}));
// }}}
// Settings / Logging {{{
app.use(require('express-log-url'));
// }}}
// Settings / Middleware {{{
global.middleware = {
	ensure: {
		/**
		* Verify that the user is logged in or else deny
		*/
		login: function(req, res, next) {
			if (req.user && req.user._id) { // Check standard passport auth (inc. cookies)
				next();
			} else {
				res.status(403).end();
			}
		},

		/**
		* Verify that the user is logged in AND is an admin OR root account
		*/
		admin: function(req, res, next) {
			if (req.user && req.user._id && (req.user.role == 'admin' || req.user.role == 'root')) {
				next();
			} else {
				res.status(403).end();
			}
		},
	},
};
// }}}
// Controllers {{{
require('./controllers/users'); // Invoke users first as it needs to install its passport middleware
requireDir('./controllers');
// }}}

// Static pages {{{
app.use(express.static(config.root + '/public'));
app.use('/app', express.static(config.root + '/app'));
app.use('/build', express.static(config.root + '/build'));
app.use('/partials', express.static(config.root + '/views/partials'));
// }}}

// Error catcher {{{
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.send(500, 'Something broke!').end();
});
// }}}

// Init {{{
var server = app.listen(config.port, config.host, function() {
	console.log('Web interface listening at', colors.cyan(config.url));
});
// }}}
