app.directive('durationPopup', function() {
	return {
		scope: {
			durationPopup: '=',
		},
		restrict: 'A',
		controller: function($scope) {
			// Inheirt $scope.elem
			$scope.$watch('durationPopup', $scope.recalc); // Watch for external changes

			$scope.add = function(val) {
				$scope.durationPopup += val;
				$scope.recalc();
			};

			$scope.recalc = function() {
				var hours = Math.floor($scope.durationPopup / (60 * 60 * 1000));
				$($scope.popoverElem).find('.durationPopup-hour').text(hours);

				var mins = Math.floor($scope.durationPopup % (60 * 60 * 1000) / (60 * 1000));
				$($scope.popoverElem).find('.durationPopup-min').text(mins);

				var secs = Math.floor($scope.durationPopup % (60 * 1000) / 1000);
				$($scope.popoverElem).find('.durationPopup-sec').text(secs);

				console.log('RECALC', hours, mins, secs);
			};
			$scope.recalc();
			console.log('LOAD!');

			$scope.close = function() {
				$scope.elem.popover('destroy');
			};
		},
		link: function($scope, elem, attr, ctrl) {
			$scope.elem = elem;
			elem.bind('click', function(e) {
				elem
					.popover({
						html: true,
						content: 
							'<div class="durationPopup text-center"><table>' +
								'<tr>' +
									'<td><a class="btn bgm-bluegray durationPopup-hour-inc"><i class="fa fa-chevron-up"></i></a></td>' +
									'<td>&nbsp;</td>' +
									'<td><a class="btn bgm-bluegray durationPopup-min-inc"><i class="fa fa-chevron-up"></i></a></td>' +
									'<td>&nbsp;</td>' +
									'<td><a class="btn bgm-bluegray durationPopup-sec-inc""><i class="fa fa-chevron-up"></i></a></td>' +
								'</tr>' +
								'<tr>' +
									'<td><label class="durationPopup-hour form-control-static">0</label></td>' +
									'<td class="form-control-static">:</td>' +
									'<td><label class="durationPopup-min form-control-static">0</label></td>' +
									'<td class="form-control-static">:</td>' +
									'<td><label class="durationPopup-sec form-control-static">0</label></td>' +
									'<td><a class="btn btn-success btn-sm durationPopup-save"><i class="fa fa-check"></i></a></td>' +
								'</tr>' +
								'<tr>' +
									'<td class="text-muted">hours</td>' +
									'<td>&nbsp;</td>' +
									'<td class="text-muted">minutes</td>' +
									'<td>&nbsp;</td>' +
									'<td class="text-muted">seconds</td>' +
								'</tr>' +
								'<tr>' +
									'<td><a class="btn bgm-bluegray durationPopup-hour-dec"><i class="fa fa-chevron-down"></i></a></td>' +
									'<td>&nbsp;</td>' +
									'<td><a class="btn bgm-bluegray durationPopup-min-dec"><i class="fa fa-chevron-down"></i></a></td>' +
									'<td>&nbsp;</td>' +
									'<td><a class="btn bgm-bluegray durationPopup-sec-dec"><i class="fa fa-chevron-down"></i></a></td>' +
								'</tr>' +
							'</table></div>',
						placement: 'bottom',
						title: 'Select duration',
						trigger: 'manual',
					})
					.popover('show');

				$scope.popoverElem = elem.data('bs.popover').$tip
					.on('click', '.durationPopup-hour-inc', function() { console.log('ADD HOUR'); $scope.add(60 * 60 * 1000) })
					.on('click', '.durationPopup-hour-dec', function() { $scope.add(0 - (60 * 60 * 1000)) })
					.on('click', '.durationPopup-min-inc', function() { $scope.add(60 * 1000) })
					.on('click', '.durationPopup-min-dec', function() { $scope.add(0 - (60 * 1000)) })
					.on('click', '.durationPopup-sec-inc', function() { $scope.add(1000) })
					.on('click', '.durationPopup-sec-dec', function() { $scope.add(0 - 1000) })
					.on('click', '.durationPopup-save', function() { $scope.close() })

				$scope.recalc();
			});
		}
	}
});
