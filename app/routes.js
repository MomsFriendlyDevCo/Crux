app.config(function($stateProvider, $urlRouterProvider) {
	$urlRouterProvider
		.otherwise('/');

	$stateProvider
		.state('home', {
			url: '/',
			views: {main: {templateUrl: '/partials/dashboard.html'}},
		})
		// General pages {{{
		.state('contact', {
			url: '/contact',
			views: {main: {templateUrl: '/partials/pages/contact.html'}}
		})
		// }}}
});