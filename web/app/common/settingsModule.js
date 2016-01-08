(function (ng) {
    "use strict";
    ng
        .module("settingsModule",[])
        .constant("appSettings",
        {         
            //localPath: "http://localhost:3000"
            localPath: "http://172.17.82.96:3000"
        });
})(angular);
