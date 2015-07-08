var app = angular.module('app', [
	'ngResource',
	'ui.router'
]);


app.config(function($compileProvider) {
	if (!location.host.match(/^local/)) {
		// Disabled in production for performance boost
		$compileProvider.debugInfoEnabled(false);
	}
});

app.config(function($httpProvider) {
	// Enable async HTTP for performance boost
	$httpProvider.useApplyAsync(true);
});

// Router related bugfixes {{{
app.run(function($rootScope) {
	// BUGFIX: Destory any open Bootstrap modals during transition {{{
	$rootScope.$on('$stateChangeStart', function() {
		$('body > .modal-backdrop').remove();
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