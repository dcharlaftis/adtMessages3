	"use strict";
	//...
  app.controller('loginController', ['$scope', '$location', '$rootScope', 'localStorageService',  
    function($scope, $location, $rootScope, localStorageService) {       
        $scope.go = function(){
         if ( $scope.username =="panacea" && $scope.password == "P@n@ce@"){
            $rootScope.log_link.value="Logout";
            localStorageService.set('authorizationData', 
                { 
                    status: "ok"
                }
             );
            $location.path("/query");
         }
                      
        }				
	}]);