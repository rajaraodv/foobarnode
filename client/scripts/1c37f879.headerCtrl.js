'use strict';

function HeaderCtrl($scope, LoginService, $rootScope, $location) {
	//Note: setting value to rootScope makes it available for EVERY controller (via $rootscope)
	$rootScope.appUser = LoginService.get();
	$scope.$watch('appUser', function() {
		$scope.loginText = $scope.appUser.username ? 'Logged in as ' + $scope.appUser.username : 'Log In';
		$rootScope.loggedIn = $scope.appUser.username ? true : false;
	}, true);

	$scope.logout = function () {
		$rootScope.appUser = '';
		$location.path('/');
	};
}

HeaderCtrl.$inject = ['$scope', 'LoginService', '$rootScope', '$location'];