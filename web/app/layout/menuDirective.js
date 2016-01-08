	"use strict";
	
  app.directive('menu2', ['$rootScope', function ($rootScope){
		return {
			restrict: 'EA',
			templateUrl: 'app/layout/views/sidebarView.html',
			link: function ($scope) {}						 
		};
	}]);
	
 