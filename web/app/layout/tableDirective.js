app.directive('myTable', ['$timeout',  function ($timeout) {
    return {
        restrict: 'E',
        templateUrl: 'app/layout/views/tableTemplate.html',
        scope: {
            tableid: '@',           
            tabledata: '=',
            ready: '@',
            tableresult: '=',                
            
        },
        link: function ($scope, element, attrs) {
            $scope.$watch('ready', function (newvalue, oldvalue) {
                if (newvalue=="true") {
                    $timeout(function () {
                        if ($scope.tableeditable == "true") 
                            $scope.toolbar_width = "col-md-6";
                        else
                            $scope.toolbar_width = "col-md-12";

                        var table = $('#' + $scope.tableid);                  
                        var oTable = table.dataTable();                                                          
                            
                    }, 0);
                }
            })
        }
    }
}]);