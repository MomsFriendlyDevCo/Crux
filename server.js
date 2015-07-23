#!/usr/bin/env node
// Initial / Config {{{
global.config = require('./config');
// }}}
// Initial / NewRelic {{{
if (config.newrelic.enabled) require('newrelic');
// }}}
// Requires {{{
var colors = require('colors');
var bodyParser = require('body-parser');
var express = require('express');
var layouts = require('express-ejs-layouts')
var fspath = require('path');
var fs = require('fs');
var requireDir = require('require-dir');
global.app = express();
// }}}
// Settings {{{
require('./config/db');
app.set('title', config.title);
app.set('view engine', "html");
app.set('layout', 'layouts/main');
app.engine('.html', require('ejs').renderFile);
app.enable('view cache');
app.use(layouts);
// }}}
// Settings / Basic Auth (DEBUGGING) {{{
// Enable this to temporarily lock down the server
// app.use(express.basicAuth('user', 'letmein'));
// }}}
// Settings / Parsing {{{
app.use(require('cookie-parser')());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(require('multer')());
// }}}
// Settings / Cookies + Sessions {{{
app.use(require('connect-flash')());
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);
app.use(session({
	secret: config.secret,
	store: new mongoStore({mongooseConnection: mongoose.connection}),
	resave: false,
	saveUninitialized: false,
	cookie: {
		expires: new Date(Date.now() + (3600000 * 48)), // 48 hours
		maxAge: (3600000 * 48) // 48 hours
	}
}));
// }}}
// Settings / Passport {{{
global.passport = require('passport');

var passportLocalStrategy = require('passport-local').Strategy;
var Users = new require('./models/users');

passport.use(new passportLocalStrategy({
	passReqToCallback: true,
	usernameField: 'username',
}, function(req, username, password, next) {
	console.log('Check login', colors.cyan(username));
	Users.findByLogin(req, username, password, next); // Delegate to the user model
}));
passport.serializeUser(function(user, next) {
	next(null, user.username);
});
passport.deserializeUser(function(id, next) {
	Users
		.findOne({username: id})
		.populate('country')
		.exec(function(err, user) {
			return next(err, user);
		});
});

// Various security blocks
global.ensure = {
	loginFail: function(req, res, next) { // Special handler to reject login and redirect to login screen or raise error depending on context
		console.log(colors.red('DENIED'), colors.cyan(req.url));
		// Failed login - decide how to return
		res.format({
			'application/json': function() {
				res.status(401).send({err: "Not logged in"}).end();
			},
			'default': function() {
				res.redirect('/login');
			},
		});
	},

	login: function(req, res, next) {
		if (req.user && req.user._id) { // Check standard passport auth (inc. cookies)
			return next();
		} else if (req.body.token) { // Token has been provided
			Users.findOne({'auth.tokens.token': req.body.token}, function(err, user) {
				if (err || !user) return ensure.loginFail(req, res, next);
				console.log('Accepted auth token', colors.cyan(req.body.token));
				req.user = user;
				next();
			});
		} else { // Not logged in and no method being passed to handle - reject
			ensure.loginFail(req, res, next);
		}
	}
};

app.use(passport.initialize());
app.use(passport.session());
// }}}
// Settings / Restify {{{
global.restify = require('express-restify-mongoose');
var ERMGuard = require('express-restify-mongoose-guard')({
	// Forbid any field that begins with '_'
	removeFields: [/^_/],

	// Allow _id and __v (but map to _v)
	renameFields: {_id: '_id', __v: '_v'},

	// Remap all DELETE methods to UPDATE setting status=deleted
	deleteUpdateRemap: {status: 'deleted'},
});
restify.defaults({
	version: '',
	middleware: ERMGuard.preHook,
	outputFn: ERMGuard.postHook,
});
// }}}
// Settings / Logging {{{
app.use(function(req, res, next){
	var _end = res.end;
	req.requestTime = new Date;
	res.end = function() {
		res.responseTime = (new Date) - req.requestTime;
		res.end = _end;

		console.log(
			(
				req.method == 'GET' ? colors.green('GET ') :
				req.method == 'POST' ? colors.green.bgWhite('POST') :
				req.method == 'PUT' ? colors.green.bgWhite('PUT '):
				req.method == 'DELETE' ? colors.green.bgWhite('DELETE'):
				colors.green(req.method)
			) + ' ' +
			(
				res.statusCode >= 400 ? colors.red(res.statusCode) :
				colors.grey(res.statusCode)
			) + ' ' +
			req.url + ' ' +
			colors.grey(res.responseTime + 'ms')
		);
		res.end.apply(res, arguments);
	};
	next();
});
// }}}
// Controllers {{{
requireDir('./controllers');
// }}}

// Static pages {{{
app.use(express.static(__dirname + '/public'));
app.use('/app', express.static(__dirname + '/app'));
app.use('/build', express.static(__dirname + '/build'));
app.use('/partials', express.static(__dirname + '/views/partials'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));
// }}}

// Error catcher {{{
app.use(function(err, req, res, next){
	console.error(err.stack);
	res.send(500, 'Something broke!').end();
});
// }}}

// Init {{{
var server = app.listen(config.port, config.host, function() {
	console.log('Web interface listening at', colors.cyan('http://' + (config.host || 'localhost') + (config.port == 80 ? '' : ':' + config.port)));
});
// }}}
