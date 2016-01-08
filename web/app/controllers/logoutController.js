	"use strict";
	//...
  app.controller('logoutController', ['$rootScope','localStorageService',  function($rootScope, localStorageService) { 
         localStorageService.set('authorizationData', null);      
         $rootScope.log_link.value="Login";                              			
	}]);