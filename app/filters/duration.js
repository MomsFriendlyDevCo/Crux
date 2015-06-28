/**
* Display a ms readout as a duration
* (requires Moment)
* 
* e.g. 60000 => '1m'
* e.g. {{something | duration}}
*
* @author Matt Carter <m@ttcarter.com>
* @date 2015-06-28
*/
app.filter('duration', function() {
	return function(value) {
		if (!value) return null;
		return moment.duration(value).asMinutes() + 'm'
	};
});
