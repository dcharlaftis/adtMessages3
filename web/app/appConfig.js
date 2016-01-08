"use strict";

app
    .config(['$httpProvider',function ($httpProvider) {        
        $httpProvider.defaults.useXDomain = true;
        $httpProvider.defaults.headers.common = 'Content-Type: application/json';
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
    }])
     .config(['localStorageServiceProvider', function(localStorageServiceProvider){
        localStorageServiceProvider.setPrefix('ls');
     }])
     .run(['$rootScope','localStorageService', function($rootScope, localStorageService){
        if  ( (localStorageService.get('authorizationData')==null)  ) {
            $rootScope.log_link = {value:"Login"};
           // $location.path( "/" );             
        }
        else
            $rootScope.log_link = {value:"Logout"}   
            
     }]);
    