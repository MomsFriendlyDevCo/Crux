app.controller('sidebarController', function($scope, $rootScope) {
	$scope.area = null;

	$rootScope.$on('$stateChangeStart', function(e, newState, newParams, oldState, oldParams) {
		var startBit;
		var startBitTest = /^(.*?)-/.exec(newState.name);
		$scope.area = startBitTest ? startBitTest[1] :
			newState.url == '/' ? null :
			newState.name;
	});
});
