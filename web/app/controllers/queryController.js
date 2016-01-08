	"use strict";
	//...
  app.controller('queryController', ['$scope', '$http', 'appSettings','$window','$rootScope', 'localStorageService', '$location',
	    function($scope, $http, appSettings, $window,  $rootScope, localStorageService, $location) {

         if (localStorageService.get('authorizationData') == null ){
             $location.path("/login");
         } 
         else{        

         $scope.items = ['Full Activity History','MRN History','Bed History', 'Current Status']
         $scope.mode="";
         $scope.query="/";
         $scope.mrn="";
         $scope.location="";
         $scope.room="";
         $scope.bed="";
                 
        $scope.clear = function($rootScope) {
           $window.location.reload();
           resultsTable.data.length=0;
           $rootScope.log_link.value="Logout";
        }    

        $scope.go = function(){
          //define table headers
          if ($scope.selectedItem!="Current Status"){
           var resultsTable ={
                    "header": [
                        { "title": "mrn" },
                        { "title": "account_no" },
                        { "title": "message_id" },
                        { "title": "control_id" },
                        { "title": "event_type" },
                        { "title": "description" },
                        { "title": "event_time" },
                        { "title": "old_location" },
                        { "title": "old_room" },
                        { "title": "old_bed" },
                        { "title": "new_location" },
                        { "title": "new_room" },
                        { "title": "new_bed" }
                    ],
            "data": [],
            "ready": false
            };
         }
         else{
          var resultsTable ={
                    "header": [
                        { "title": "mrn" },
                        { "title": "account_no" },                        
                        { "title": "location" },
                        { "title": "room" },
                        { "title": "bed" }
                    ],
            "data": [],
            "ready": false
            };
         }
          
          //flush previous results
           resultsTable.data.length=0;

        	if ($scope.dateFrom==null)
        		$scope.dateFrom = 20151001;
        	if ($scope.dateTo==null)
        		$scope.dateTo = 20651001;
        	if ($scope.selectedItem == "Full Activity History"){
        		$scope.mode="lrbm";
            $scope.query = "/lrbm/"+ $scope.dateFrom +"/"+ $scope.dateTo + "/x/x/x" ;
          }
        	else if ($scope.selectedItem == "MRN History"){
        		$scope.mode="mh";
            $scope.query = "/mh/"+ $scope.mrn +"/" + $scope.dateFrom + "/" + $scope.dateTo + "/x/x" ;
          }
        	else if ($scope.selectedItem == "Bed History"){
        		$scope.mode="bh";
            $scope.query = "/bh/"+$scope.location+"/"+$scope.room+"/" + $scope.bed +"/"+$scope.dateFrom +"/"+ $scope.dateTo ;
          }
          else if ($scope.selectedItem == "Current Status"){
            $scope.mode="cs";
            $scope.query = "/cs/x/x/x/x/x" ;
          }

          $scope.showIt=true;
                  	
          //$http.get(appSettings.localPath +"/webadt" + $scope.query ).
          $http.get("/webadt" + $scope.query ).
                    success(function (response, status) {
                      // console.log('recs ->', response.length);
                      // console.log('query ->', appSettings.localPath + "/webadt" + $scope.query);
                      // console.log('succesfull ->', response);

                       response.forEach(function (rec) {
                         var recData = [];
                         if ($scope.selectedItem!="Current Status"){
                           recData.push( {"value": rec.mrn} );
                           recData.push( {"value": rec.account_no} );
                           recData.push( {"value": rec.message_id} );
                           recData.push( {"value": rec.control_id} );
                           recData.push( {"value": rec.event_type} );
                           recData.push( {"value": rec.description} );
                           recData.push( {"value": rec.event_time} );
                           recData.push( {"value": rec.old_location} );
                           recData.push( {"value": rec.old_room} );
                           recData.push( {"value": rec.old_bed} );
                           recData.push( {"value": rec.new_location} );
                           recData.push( {"value": rec.new_room} );
                           recData.push( {"value": rec.new_bed} );
                         }
                         else{
                           recData.push( {"value": rec.mrn} );
                           recData.push( {"value": rec.account_no} );
                           recData.push( {"value": rec.location} );
                           recData.push( {"value": rec.room} );
                           recData.push( {"value": rec.bed} );
                         }
                         resultsTable.data.push(recData);
                      });

                      $scope.resultsTable = resultsTable;
                      $scope.showIt=false;
                      $scope.resultsTable.ready = true;               
                    }).
                    error(function (response, status) {
                       $scope.showIt=false;                        
                       console.log('error->', response);
                    });          	
        }

     }//end else
				
	}]);