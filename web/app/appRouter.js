'use strict';
 
app
.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {

      $urlRouterProvider.otherwise("/");

      $stateProvider      
        .state('lala', {
                url: "/",
	              template: "<div ui-view></div> "	,
				        controller: 'lalaController'								
         })
         .state('lala.login', {
              url: "login",
              templateUrl: "app/views/loginView.html",
              controller: 'loginController'                
                })  
          .state('lala.logout', {
              url: "logout",
              templateUrl: "app/views/logoutView.html",
              controller: 'logoutController'                
                }) 
			  .state('lala.query', {
              url: "query",
              templateUrl: "app/views/queryView.html",
			        controller: 'queryController'                
                })             			
		}]);


						

