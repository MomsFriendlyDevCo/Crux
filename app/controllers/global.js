// App global controller (also $rootScope)
app.controller('globalController', function($scope, $rootScope, User) {
	// .user {{{
	$scope.user = null;
	User.profile().$promise.then(function(data) {
		$scope.user = data;
	});
	// }}}
});
