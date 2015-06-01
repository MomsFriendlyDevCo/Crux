/**
* Similar to the translate filter but expects a collection of objects to be passed to it to lookup the correct value to display
*
* In the controller:
* $scope.statuses = [
* 	{id: 'active', title: 'Active'},
* 	{id: 'deleted', title: 'Deleted'}
* ];
*
* In the template:
*	{{ something.status | translateCollection:statuses }}
*/
app.filter('translateCollection', [function () {
	return function(input, translations) {
		if (!input) return;
		var found = _.find(translations, {id: input});
		if (found) {
			return found.title;
		} else {
			return 'Unknown';
		}
	};
}]);
