function ileadCtrl($scope) {
	$scope.navMenu = [
		{
			name: "1",
			href: "#"
		},
		{
			name: "2",
			href: "#"
		},
		{
			name: "3",
			href: "#"
		}];
}

var ileadApp = angular.module("ileadApp", []);

ileadApp.controller("ileadCtrl", ileadCtrl);
