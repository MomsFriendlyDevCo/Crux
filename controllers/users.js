var _ = require('lodash');
var async = require('async-chainable');
var colors = require('chalk');
var Users = require('../models/users');
var uuid = require('uuid');

// Passport setup {{{
var passport = require('passport');
var passportLocalStrategy = require('passport-local').Strategy;

// Setup local stratergy
passport.use(new passportLocalStrategy({
	passReqToCallback: true,
	usernameField: 'username',
}, function(req, username, password, next) {
	console.log(colors.blue('[LOGIN]'), 'Check login', colors.cyan(username));

	// Lookup user by username
	Users.findOne({$errNotFound: false, username: username}, function(err, user) {
		if (err) return next(err);
		if (!user) {
			console.log(colors.blue('[LOGIN]'), 'Username not found', colors.cyan(username));
			return next(null, false, req.flash('passportMessage', 'Incorrect username'));
		} else if (user.status =='unverified'){
			console.log(colors.blue('[LOGIN]'), 'Account not verified', colors.cyan(username));
			return next(null, false, req.flash('passportMessage', 'Account not verified'));
		} else {
			user.validPassword(password, function(err, isMatch) {
				if (err) return next(err);
				if (!isMatch) {
					console.log(colors.blue('[LOGIN]'), 'Invalid password for', colors.cyan(username));
					next(null, false, req.flash('passportMessage', 'Incorrect password'));
				} else {
					console.log(colors.blue('[LOGIN]'), 'Successful login for', colors.cyan(username));
					next(null, user);
				}
			});
		}
	});
}));

// Tell passport what to save to lookup the user on the next cycle
passport.serializeUser(function(user, next) {
	next(null, user.username);
});

// Tell passport to to retrieve the full user we stashed in passport.serializeUser()
passport.deserializeUser(function(id, next) {
	Users
		.findOne({username: id}, function(err, user) {
			return next(err, user);
		});
});

// Boot passport and its session handler
app.use(passport.initialize());
app.use(passport.session());
// }}}

app.post('/login', passport.authenticate('local', {
	failureRedirect: '/login',
	failureFlash: true
}), function(req, res){
	if(req.user.token){
		//User requested password reset but logs in with current password
		Users.update({username:req.user.username}, {token:null}, function(err, doc){
			res.redirect('/')
		})
	} else {
		res.redirect('/');
	}
});

app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});

app.get('/login', function(req, res) {
	if (req.user) // Already logged in
		return res.redirect('/');

	res.render('pages/login', {
		layout: 'layouts/promo',
		namespace: 'plain',
		message: req.flash('passportMessage'),
	});
});

app.get('/signup', function(req, res) {
	res.render('pages/signup', {
		layout: 'layouts/promo',
		namespace: 'plain',
		message: req.flash('signupMessage'),
		values: {key: '', name: '', email: '', password: ''},
	});
});

app.post('/signup', function(req, res, finish) {
	// Rather crappy checking - yes this needs improvement MC 2014-12-31

	async()
		.then(function(next) { // Form validation
			if (!req.body.name) {
				next('No name specified')
			} else if (!req.body.email) {
				next('No email specified')
			} else if (!/^(.*)@(.*)$/.test(req.body.email)) { // FIXME: Ugh!
				next('That doesnt look like a valid email address')
			} else if (!req.body.password) {
				next('No password specified')
			} else {
				next();
			}
		})
		.then(function(next) { // Check email isn't already in use
			Users.findOne({email: req.body.email}, function(err, user) {
				if (user) return next('Email already registered');
				next();
			});
		})
		.then(function(next) { // Create the user
			return Users.create({
				name: req.body.name,
				email: req.body.email,
				password: req.body.password,
			}, function(err) {
				if (err) return res.status(400).send(err.err); // DB raised error
				return passport.authenticate('local', { // Log the user in
					successRedirect: '/',
					failureRedirect: '/login',
					failureFlash: true,
				})(req, res, finish);
				next(); // Finalize so we drop out of this nest of series actions
			});
		})
		.end(function(err) {
			if (err) { // There was an issue creating the account
				req.flash('signupMessage', err); // Setup the message to display

				// Re-render the signup form

				var values = {
					key: '',
					name: '',
					email: '',
					password: '',
				};
				_.assign(values, req.body);

				res.render('pages/signup', {
					layout: 'layouts/promo',
					namespace: 'plain',
					message: req.flash('signupMessage'),
					values: values,
				});
			}
		});
});

app.get('/api/users/profile', function(req, res) {
	if (!req.user) return res.status(200).send({});

	// Decide what gets exposed to the front-end
	res.send({
		_id: req.user._id,
		username: req.user.username,
		email: req.user.email,
		name: req.user.name,
		role: req.user.role,
		isAdmin: (req.user.role != 'user'),
		isRoot: (req.user.role == 'root'),
		settings: req.user.settings,
	});
});

/**
* Save the user profile
* @param object req.body.settings Settings object to save
*/
app.post('/api/users/profile', function(req, res) {
	async()
		.then(function(next) {
			// Sanity checks {{{
			if (!req.user) return next('User is not logged in');
			if (!req.body.settings) return next('No .settings object specified');
			if (!_.isObject(req.body.settings)) return next('.settings must be an object');
			next();
			// }}}
		})
		.then(function(next) {
			req.user.settings = req.body.settings;
			req.user.save();
			next();
		})
		.end(function(err) {
			if (err) return res.status(400).send(err);
			res.status(200).end();
		});
});

app.post('/api/users/login', function(req, res) {
	async()
		.then('profile', function(next) {
			passport.authenticate('local', function(err, user, info) {
				if (err) return next(err);
				if (user) {
					console.log(colors.green('Successful login for'), colors.cyan(req.body.username));
					req.logIn(user, function(err) {
						if (err) return next(err);
						next();
					});
				} else {
					console.log(colors.red('Failed login for'), colors.cyan(req.body.username));
					next('Unauthorized');
				}
			})(req, res, next);
		})
		.end(function(err) {
			if (err) return res.send({error: 'Invalid username or password'});
			res.redirect('/api/users/profile');
		});
});

app.post('/api/users/logout', function(req, res) {
	req.logout();
	res.status(200).send({});
});
