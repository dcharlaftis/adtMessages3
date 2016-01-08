
"use strict";
var express = require('express')
  , u = require("lodash-node")
  , app = express()
  , mongoose = require("mongoose")
  , fs = require("fs")
  , path = require("path")
  , async = require("async");

require('scribe-js')();
var console=process.console;
var config = require("../config/config.js");
mongoose.connect(config.dbConnectionString);

var db, LogLocation ;

function loadModels(cb){
  var rootDir = __dirname
  , modelDir = path.join(rootDir, "../models")
	, modelFiles = fs.readdirSync(modelDir);
  
  u.each(modelFiles, function(filePath){
    require(path.join(modelDir, filePath)); 
  });
  cb(null);
}

/////////////////


function getLocationRoomBedMrn (cb){   
   var query  ={};

   if (process.argv[3] ==null){
   	console.log("date not given");
    process.exit(90);
   }
   else if ((process.argv[3] !="-di")&&(process.argv[3].length!=4) && (process.argv[3].length!=6) && (process.argv[3].length!=8) && (process.argv[3].length!=10) && (process.argv[3].length!=12) ){
   	console.log("Date not given in correct format. It must have 8 , 6 or 4 digits (yyyymmdd or yyyymm or yy).");
    process.exit(91);
   }
   else{   	 

     if (process.argv[3] =="-di"){
      if ( (process.argv[4] == null) || (process.argv[5] == null))
          { console.log("Interval dates not given."); process.exit(41); }
      if ( (process.argv[4].length != 8) || (process.argv[5].length!=8))
          { console.log("Interval dates not given in the correct format."); process.exit(41); }  
      
      var date_from = process.argv[4];
      var date_to = process.argv[5];
      var date_to_regex = "^"+date_to;

      query = {$or:[ {$and: [{event_time: {$gte: date_from}}, 
                             {event_time: {$lte: date_to}}
                            ]
                      },
                     { event_time:  { $regex: date_to_regex }}
                   ]
               }; 
      console.log ("Getting Location-Room-Bed-Mrn for date interval [%s -> %s] ", date_from, date_to);
      var filename = "./csv/getLocationRoomBedMrn_for_"+date_from+"-"+date_to+".txt";                    
     }
     else {
       var date = process.argv[3];
       var regExDate = "^"+date;

       query = { event_time:  { $regex: regExDate }};
       console.log ("Getting Location-Room-Bed-Mrn for date ", date);
       var filename = "./csv/getLocationRoomBedMrn_for_"+date+".txt";
     }
     
   	 var header = "mrn \t account_no \t message_id \t control_id \t event_type \t description \t event_time \t old_location \t old_room \t old_bed \t new_location \t new_room \t new_bed \n";
   	 
   	 fs.appendFile(filename, header, function (err) {
          if (err){
          	console.log("error in file writing -1" , err);
            cb(null);
          }          
      });

   	  LogLocation.find(query ,
        function (err, recs) {
      
           if (err){
                 console.error("error in client application - getLocationRoomBedMrn", err);
                 cb(err);
           }
           console.log("records=",recs.length);
           
           async.forEachOfSeries(recs, 
             function (rec, index, callback) 
             {
              // console.log("rrrr%s", index);
               var csvTuple = rec.mrn+"\t"+ rec.account_no +"\t"+ rec.message_id+"\t" + rec.control_id+"\t" +
                              rec.event_type + "\t" + rec.description+"\t"+
                              rec.event_time +"\t" + rec.old_location +"\t"+
                              rec.old_room + "\t" + rec.old_bed +"\t"+
                              rec.new_location +"\t" + rec.new_room +"\t"+rec.new_bed +"\n";

                fs.appendFile(filename, csvTuple, function (err) {
    		          if (err)
    		          	return callback(err) ; 
                  callback ();            
                 });

             }, 
             function(err) {
                  if (err) return console.log("error in file writing -2" , err); 
                  console.log ("results written in " + filename);
                  cb(null);
              }
          );        

   	  });

   }   	
   	
}

////////////////

function getMrnHistory(cb){
  var query = {};

  if (process.argv[3] ==null){
    console.log("mrn not given");
    process.exit(90);
   }  
  else if ((process.argv[4] !="-di")&&(process.argv[4] !=null)&&(process.argv[4].length!=4) && (process.argv[4].length!=6) && (process.argv[4].length!=8) && (process.argv[4].length!=10) && (process.argv[4].length!=12) ){
    console.log("Date not given in correct format. It must have 8 , 6 or 4 digits (yyyymmdd or yyyymm or yy).");
    process.exit(95);
   }
 else{
     var mrn = process.argv[3];

    if (process.argv[4] =="-di"){
      if ( (process.argv[5] == null) || (process.argv[6] == null))
          { console.log("Interval dates not given."); process.exit(41); }
      if ( (process.argv[5].length != 8) || (process.argv[6].length!=8))
          { console.log("Interval dates not given in the correct format."); process.exit(41); }  
      
      var date_from = process.argv[5];
      var date_to = process.argv[6];
      var date_to_regex = "^"+date_to;

      query = {$or:[ {$and: [{event_time: {$gte: date_from}}, 
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
      console.log ("Getting MRN history for mrn = %s in date interval [%s -> %s] ", mrn, date_from, date_to);
      var filename = "./csv/getMrnHistory_for_"+mrn+"_"+date_from+"-"+date_to+".txt";                    
     }
    else{
      var date = process.argv[4];
      var regExDate = "^"+date;
    
     if (date ==null){
       console.log ("Getting MRN history for mrn = %s", mrn);
       var filename = "./csv/getMrnHistory_for_"+mrn+".txt";
       query = { mrn:  mrn} ;
     } else {
       console.log ("Getting MRN history for mrn = %s in date = %s", mrn, date);
       var filename = "./csv/getMrnHistory_for_"+mrn+"_"+date+".txt";
       query = {$and: [ { event_time:  { $regex: regExDate }} , { mrn:  mrn} ]};
     }
    }

     var header = "mrn \t account_no \t message_id \t control_id \t event_type \t description \t event_time \t old_location \t old_room \t old_bed \t new_location \t new_room \t new_bed \n";
     fs.appendFile(filename, header, function (err) {
          if (err){
            console.log("error in file writing -3" , err);
            cb(null);
          }          
      });  
         
     LogLocation.find(query)
                .sort({ "event_time": 1 })
                .exec( function (err, recs) {
      
                   if (err){
                         console.error("error in client application - getMrnHistory", err);
                         cb(err);
                   }
                   console.log("records=",recs.length);
                   
                   async.forEachOfSeries(recs, 
                     function (rec, index, callback) 
                     {
                      // console.log("rrrr%s", index);
                       var csvTuple = rec.mrn+"\t"+ rec.account_no +"\t"+ rec.message_id+"\t" + rec.control_id+"\t" +
                                      rec.event_type + "\t" + rec.description+"\t"+
                                      rec.event_time +"\t" + rec.old_location +"\t"+
                                      rec.old_room + "\t" + rec.old_bed +"\t"+
                                      rec.new_location +"\t" + rec.new_room +"\t"+rec.new_bed +"\n";

                        fs.appendFile(filename, csvTuple, function (err) {
                          if (err)
                            return callback(err) ; 
                          callback ();            
                         });

                     }, 
                     function(err) {
                          if (err) return console.log("error in file writing -5" , err); 
                          console.log ("results written in " + filename);
                          cb(null);
                      }
                  );        

                });     

  }

}
//////////////////
function getBedHistory(cb){
  var query = {};

  if (process.argv.length < 6){
    console.log("location-room-bed input not given ");
    process.exit(94);
   }
 else{
     var location = process.argv[3];
     var room = process.argv[4];
     var bed = process.argv[5];
    


     if (process.argv[6] =="-di"){
      if ( (process.argv[7] == null) || (process.argv[8] == null))
          { console.log("Interval dates not given."); process.exit(41); }
      if ( (process.argv[7].length != 8) || (process.argv[8].length!=8))
          { console.log("Interval dates not given in the correct format."); process.exit(41); }  
      
      var date_from = process.argv[7];
      var date_to = process.argv[8];
      var date_to_regex = "^"+date_to;

      query = {$or:[
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
      console.log ("Getting location-room-bed history for %s %s %s in date interval [%s -> %s] ", location, room, bed, date_from, date_to);
      var filename = "./csv/getBedHistory_for_"+location+"_"+room+"_"+bed+"_"+date_from+"-"+date_to+".txt";                    
     }
     else {
        var date = process.argv[6];
        var regExDate = "^"+date;
   
        if (date ==null){
          console.log ("Getting location-room-bed history for %s %s %s ", location, room, bed);
          var filename = "./csv/getBedHistory_for_"+location+"_"+room+"_"+bed+".txt";
          query = {$or: [
                        {$and: [{ old_location:  location}, { old_room:  room}, { old_bed:  bed} ]},
                        {$and: [{ new_location:  location}, { new_room:  room}, { new_bed:  bed} ]}
                     ]
                  };
        }else{
          if ((date.length!=4) && (date.length!=6) && (date.length!=8) && (date.length!=10) && (date.length!=12) ){
             console.log("Date not given in correct format. It must have 8 , 6 or 4 digits (yyyymmdd or yyyymm or yy).");
             process.exit(95);
          }
         console.log ("Getting location-room-bed history for %s %s %s in date interval = %s", location, room, bed, date);
         var filename = "./csv/getBedHistory_for_"+location+"_"+room+"_"+bed+"_"+date+".txt"; 
         query = {$or: [
                        {$and: [{ old_location:  location}, { old_room:  room}, { old_bed:  bed}, { event_time:  { $regex: regExDate }} ]},
                        {$and: [{ new_location:  location}, { new_room:  room}, { new_bed:  bed}, { event_time:  { $regex: regExDate }} ]}
                      ]
                };

       }
     }     

     var header = "mrn \t account_no \t message_id \t control_id \t event_type \t description \t event_time \t old_location \t old_room \t old_bed \t new_location \t new_room \t new_bed \n";
     
     fs.appendFile(filename, header, function (err) {
          if (err){
            console.log("error in file writing -7" , err);
            cb(null);
          }          
      });      

     LogLocation.find(query)
                .sort({ "event_time": 1 })
                .exec( function (err, recs) {
      
                   if (err){
                         console.error("error in client application - getBedHistory", err);
                         cb(err);
                   }
                   console.log("records=",recs.length);
                   
                   async.forEachOfSeries(recs, 
                     function (rec, index, callback) 
                     {
                      // console.log("rrrr%s", index);
                       var csvTuple = rec.mrn+"\t"+ rec.account_no +"\t"+ rec.message_id+"\t" + rec.control_id+"\t" +
                                      rec.event_type + "\t" + rec.description+"\t"+
                                      rec.event_time +"\t" + rec.old_location +"\t"+
                                      rec.old_room + "\t" + rec.old_bed +"\t"+
                                      rec.new_location +"\t" + rec.new_room +"\t"+rec.new_bed +"\n";

                        fs.appendFile(filename, csvTuple, function (err) {
                          if (err)
                            return callback(err) ; 
                          callback ();            
                         });

                     }, 
                     function(err) {
                          if (err) return console.log("error in file writing -9" , err); 
                          console.log ("results written in " + filename);
                          cb(null);
                      }
                  );        

                });     

  }

}



/////////////////////////////////////////////////////////
 //define db connection
  db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  
  db.once('open', function (callback) {
    console.log ( "yay client connected to mongo db!");    
    
    loadModels(function(){      	
         LogLocation = mongoose.model("Location_log");    
         
         if (process.argv[2]=="-lrbm")
         	  getLocationRoomBedMrn(function(){
       	      console.log ("Exiting..");
         	    process.exit(10);
         	});
         else if (process.argv[2]=="-mh")
         	  getMrnHistory(function(){
         		  console.log ("Exiting...");
              process.exit(10);         	
         	});
         else if (process.argv[2]=="-bh")
         	getBedHistory(function(){
         		  console.log ("Exiting....");
              process.exit(10);           	
         	});

         else 
         	 { console.log("Wrong input arguments."); process.exit(44); }

    });
  });
   