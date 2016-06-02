var app = angular.module('app', [
	'angular-bs-confirm',
	'angular-bs-popover',
	'angular-bs-tooltip',
	'angular-ui-loader',
	'ngResource',
	'ui.gravatar',
	'ui.router',
	'ui-notification',
	'uiSwitch',
]);


app.config(function($compileProvider) {
	if (!location.host.match(/^local|glitch|slab/)) { // Are we on localhost etc?
		// Disabled in production for performance boost
		$compileProvider.debugInfoEnabled(false);
	}
});

app.config(function($httpProvider) {
	// Enable async HTTP for performance boost
	$httpProvider.useApplyAsync(true);
});

// Loader display while routing {{{
app.run(function($rootScope, $loader, $state) {
	$rootScope.$on('$stateChangeStart', () => $loader.clear().start('stateChange'));
	$rootScope.$on('$stateChangeSuccess', () => $loader.stop('stateChange'));
	$rootScope.$on('$stateChangeError', () => $loader.stop('stateChange'));
});
// }}}

// Notification config {{{
app.config(function(NotificationProvider) {
	NotificationProvider.setOptions({
		positionX: 'right',
		positionY: 'bottom'
	});
});
// }}}

// Router related bugfixes {{{
app.run(function($rootScope) {
	// BUGFIX: Destory any open Bootstrap modals during transition {{{
	$rootScope.$on('$stateChangeStart', function() {
		// Destory any open Bootstrap modals
		$('body > .modal-backdrop').remove();

		// Destroy any open Bootstrap tooltips
		$('body > .tooltip').remove();

		// Destroy any open Bootstrap popovers
		$('body > .popover').remove();
	});
	// }}}
	// BUGFIX: Focus any input element with the 'autofocus' attribute on state change {{{
	$rootScope.$on('$stateChangeSuccess', function() {
		$('div[ui-view=main]').find('input[autofocus]').focus();
	});
	// }}}
});
// }}}

// jQuery related bugfixes {{{
// Focus items within a modal if they have the [autofocus] attrib {{{
$(document).on('shown.bs.modal', function() {
	var childFocus = $(this).find('.modal.in [autofocus]');
	if (childFocus.length) childFocus.first().focus();
});
// }}}
// }}}

// Insist that the URL must be of the form something.com/#/route (i.e. that hash should be prefixed by a slash) {{{
if (window.location.pathname.substr(-1) != '/') window.location.pathname += '/';
// }}}
