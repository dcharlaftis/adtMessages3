module.exports = function(){

"use strict";
var express = require('express')
  , u = require("lodash-node")
  , app = express()
  , mongoose = require("mongoose")
  , path = require("path")  
  , fs = require("fs")
  , async = require("async");

require('./models/movement_log.js');
require('./models/mrn_location.js');
//var console=process.console;
var config = require("./config/config.js");
//mongoose.connect(config.dbConnectionString);

var db;
var LogLocation  = mongoose.model("Location_log"); 
var MRNLocation = mongoose.model("MrnLocation");

function getCurrentStatus (res, cb){              
  var query = {valid:"1"}; 

  var projection = {
                     "mrn":1, "account_no":1, "location":1, "room":1, "bed":1
                   }; 
           
  console.log ("Getting current status...");                               

    MRNLocation.find(query, projection)               
               .exec( function (err, recs) {  
                 if (err){
                       console.error("error in client application - getCurrentStatus", err);
                       cb(err);
                 }
                 console.log("records=",recs.length); 
                 res.json(recs);               
              });       
}

function getLocationRoomBedMrn (res, arg2, arg3, cb){                   
  var date_from = arg2;
  var date_to = arg3;
  var date_to_regex = "^"+date_to;

  var query = {$or:[ {$and: [{event_time: {$gte: date_from}}, 
                         {event_time: {$lte: date_to}}
                        ]
                  },
                 { event_time:  { $regex: date_to_regex }}
               ]
           }; 

  var projection = {
                     "mrn":1, "account_no":1, "message_id":1, "control_id":1, "event_type":1,
                     "description":1, "event_time":1 , "old_location":1, "old_room":1, "old_bed":1,
                     "new_location":1, "new_room":1, "new_bed":1
                   }; 
           
  console.log ("Getting Location-Room-Bed-Mrn for date interval [%s -> %s] ", date_from, date_to);                         	   	 

	  LogLocation.find(query, projection)
               .sort({ "event_time": 1 })
               .exec( function (err, recs) {  
                 if (err){
                       console.error("error in client application - getLocationRoomBedMrn", err);
                       cb(err);
                 }
                 console.log("records=",recs.length); 
                 res.json(recs);               
          	  });     	
}

function getMrnHistory(res, arg2, arg3, arg4, cb){  
  var mrn = arg2;          
  var date_from = arg3;
  var date_to = arg4;
  var date_to_regex = "^"+date_to;

  var query = {$or:[ {$and: [{event_time: {$gte: date_from}}, 
                         {event_time: {$lte: date_to}}, 
                         { mrn:  mrn}
                        ]
                  },
                  {$and: [ { event_time:  { $regex: date_to_regex }},
                           { mrn:  mrn}
                         ] 
                  }
               ]
           };

  var projection = {
                 "mrn":1, "account_no":1, "message_id":1, "control_id":1, "event_type":1,
                 "description":1, "event_time":1 , "old_location":1, "old_room":1, "old_bed":1,
                 "new_location":1, "new_room":1, "new_bed":1
               }; 

 console.log ("Getting MRN history for mrn = %s in date interval [%s -> %s] ", mrn, date_from, date_to);                         
              
 LogLocation.find(query, projection)
            .sort({ "event_time": 1 })
            .exec( function (err, recs) {
  
               if (err){
                     console.error("error in client application - getMrnHistory", err);
                     cb(err);
               }
               console.log("records=",recs.length);                  
               res.json(recs);     
            }); 
}

function getBedHistory(res, arg2, arg3, arg4, arg5, arg6, cb){ 
   var location = arg2;
   var room = arg3;
   var bed = arg4;          
   var date_from = arg5;
   var date_to = arg6;
   var date_to_regex = "^"+date_to;

   var query = {$or:[
                   {$or: [
                         {$and: [{ old_location:  location}, { old_room:  room}, { old_bed:  bed}, {event_time: {$gte: date_from}}, {event_time: {$lte: date_to}} ]},
                         {$and: [{ new_location:  location}, { new_room:  room}, { new_bed:  bed}, {event_time: {$gte: date_from}}, {event_time: {$lte: date_to}} ]}
                       ]
                    },
                    {$and: [ { event_time:  { $regex: date_to_regex }},
                             {$or: [
                                    {$and: [{ old_location:  location}, { old_room:  room}, { old_bed:  bed} ]},
                                    {$and: [{ new_location:  location}, { new_room:  room}, { new_bed:  bed} ]}
                                   ]
                              }
                           ] 
                    }
                 ]
             }; 

    var projection = {
                   "mrn":1, "account_no":1, "message_id":1, "control_id":1, "event_type":1,
                   "description":1, "event_time":1 , "old_location":1, "old_room":1, "old_bed":1,
                   "new_location":1, "new_room":1, "new_bed":1
                 }; 

   console.log ("Getting location-room-bed history for %s %s %s in date interval [%s -> %s] ", location, room, bed, date_from, date_to);                          
    
   LogLocation.find(query, projection)
              .sort({ "event_time": 1 })
              .exec( function (err, recs) {
    
                 if (err){
                       console.error("error in client application - getBedHistory", err);
                       cb(err);
                 }
                 console.log("records=",recs.length);
                 res.json(recs);   
              });   
  }

///////////////////////////////////////////////////

app.get('/:arg1/:arg2/:arg3/:arg4/:arg5/:arg6', function (req, res) {

   var arg1 = req.params.arg1;
   var arg2 = req.params.arg2;
   var arg3 = req.params.arg3;
   var arg4 = req.params.arg4;
   var arg5 = req.params.arg5;
   var arg6 = req.params.arg6;

   res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
   res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE,OPTIONS');
   // Set custom headers for CORS
   res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token, X-Requested-With, Origin');
   if (req.method == 'OPTIONS') {
     res.status(200).end();
   } 

   if (arg1=="lrbm"){    
    getLocationRoomBedMrn(res, arg2, arg3, function(){
        console.log ("Exiting..");       
      });  
   } else if (arg1=="mh"){    
    getMrnHistory(res, arg2, arg3, arg4, function(){
        console.log ("Exiting..");       
      });
   }
   else if (arg1=="bh"){    
    getBedHistory(res, arg2, arg3, arg4, arg5, arg6, function(){
        console.log ("Exiting..");       
      });
   }
   else if (arg1=="cs"){    
    getCurrentStatus(res, function(){
        console.log ("Exiting..");       
      });
   }         
   else 
     { console.log("Wrong input arguments."); process.exit(44); }  
 
});

///////////////////////////////////////////////////////
/*
var server = app.listen(config.webAdtPort, function () {
  //define db connection
  db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  
  db.once('open', function (callback) {
    console.log ( "Yay client connected to mongo db! Listening on Port ",config.webAdtPort );    
    
    loadModels(function(){      	
         LogLocation = mongoose.model("Location_log");               

    });
  });
});
*/
return app;
}();
   