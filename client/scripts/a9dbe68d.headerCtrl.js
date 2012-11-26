'use strict';

function HeaderCtrl($scope, LoginService) {
	$scope.user = LoginService.get();
	$scope.$watch('user', function() {
		$scope.loginText = $scope.user.username ? 'Logged in as ' + $scope.user.username : 'Log In';
		$scope.loggedIn = $scope.user.username ? true : false;
	}, true);

}
HeaderCtrl.$inject = ['$scope', 'LoginService'];