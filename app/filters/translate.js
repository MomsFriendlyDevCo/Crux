/**
* Translate an incomming value with an item from a lookup object
*
* e.g.
*	{{ something.status | translate:{active:'Active',deleted:'Deleted'} }}
*/
app.filter('translate', [function () {
	return function(input, translations) {
		if (translations[input])
			return translations[input];
		return 'Unknown';
	};
}]);
