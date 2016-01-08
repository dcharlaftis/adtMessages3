//program that reads the logs collection and produces the mrn location
//used to read quicker than the original hl7 collection

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
var config = require("./config/config.js");

//mongoose.connect('mongodb://panacea:panacea01@localhost:27017/adt_msg_store');
mongoose.connect(config.dbConnectionString);


var db;
var MrnLocation ;
var LogLocation ;
var maxID;

/////////////////////////////////
    //help functions
    ///////////////////////
function eventTranslator(event){
  if (event == "A000")
    return "Malformed message";
  if (event == "A01")
    return "Admit/visit notification";
  if (event == "A02")
    return "Transfer a patient";
  if (event == "A03")
    return "Discharge/end visit";
  if (event == "A04")
    return "Register a patient";
  if (event == "A05")
    return "Pre-admit a patient";
  if (event == "A06")
    return "Change an outpatient to an inpatient";
  if (event == "A07")
    return "Change an inpatient to an outpatient";
  if (event == "A08")
    return "Update patient information";
  if (event == "A11")
    return "Cancel admit/visit notification";
  if (event == "A12")
    return "Cancel transfer";
  if (event == "A13")
    return "Cancel discharge/end visit";
  if (event == "A14")
    return "Pending Admit";
  if (event == "A17")
    return "Swap patients";
  if (event == "A31")
    return "Demo-recall Edits";
  if (event == "A34")
    return "Merge/Unmerge/MergeI/UnmergeI";
  if (event == "A35")
    return "Merge (account number only)";
  if (event == "A38")
    return "Cancel pre-admit";
  if (event == "A40")
    return "Merge/Unmerge/MergeI/UnmergeI Patient - Patient Identifier (Active and Inactive Accounts)";
  if (event == "A41")
    return "Merge Patient - Patient Account Number";
  if (event == "A44")
    return "Switch Patient (Account)";
}


function tupleUpdater(event, tuple, rec){
  var update_tuple;
  //if event type is referred to cancel admit(A11) or cancel pre-admit(A38) or discharge - A03
  //mrn record should set the valid key to zero 
  //ONLY IF the rec.account_no (from mrn collection in database) == tuple.account_no
  

  if ((event == "A11") || (event == "A38") || (event == "A03")) {
    if (rec.account_no == tuple.account_no){
      console.log ("Erasing account %s, mrn %s with message %s control id = %s", rec.account_no, tuple.mrn, event, tuple.control_id );

      tuple.new_location = "Null_for_"+tuple.mrn; //for uniqueness in deletions
      tuple.new_bed = "Null";
      tuple.new_room = "Null"; 

      update_tuple = {
        account_no: tuple.account_no,
        location: tuple.new_location,
        bed: tuple.new_bed ,
        room: tuple.new_room,
        valid: "0"
      } 
    }    
    else{ //keep the old rec stuff
      console.log ("Message %s with control_id %s containing account no %s cannot discharge patient with account no = %s  ",event, tuple.control_id, tuple.account_no, rec.account_no);
      update_tuple = {
        account_no: rec.account_no,
        location: rec.location,
        bed: rec.bed ,
        room: rec.room,
        valid: rec.valid
      } 
    }         
  }  
  // if you receive an update (A08) message containing a DIS, PRE, REG, DEP tag, dont update him
  else if ((event =="A08") && 
           ((tuple.dis=="DIS") || (tuple.dis=="PRE") || (tuple.dis=="REG") ||(tuple.dis=="DEP")) 
          ){
        //keep the old rec stuff
        console.log ("Update message %s with control_id %s containing account no %s cannot update patient with account no = %s  ",event, tuple.control_id, tuple.account_no, rec.account_no);
        update_tuple = {
          account_no: rec.account_no,
          location: rec.location,
          bed: rec.bed ,
          room: rec.room,
          valid: rec.valid
      }    
  }    
  else //default condition - make the update with no cancellations
    update_tuple = {
      account_no: tuple.account_no,
      location: tuple.new_location,
      bed: tuple.new_bed,
      room: tuple.new_room,
      valid: "1"
    };
  return update_tuple;
}

function storeTuple(tuple, index, callback){
  MrnLocation.find({ mrn: tuple.mrn } ,function (err, recs) {  	
    if (err) {    
      console.error("error in storeTuple: MrnLocation.find", err);
      return callback(err);
      }
    else if (recs.length==0) { //if mrn does not exist in there add it along with location      
      var dbTuple = new MrnLocation({
        mrn: tuple.mrn,
        account_no: tuple.account_no,
        location: tuple.new_location,
        bed: tuple.new_bed,
        room: tuple.new_room,
        valid: "1" //if record is not deleted by some message
      });      
      
      async.series([
        function(cb){
         if ( (tuple.new_location=="not_defined" ) || (tuple.new_room=="not_defined") || (tuple.new_bed=="not_defined") ||
              ( (tuple.event_type =="A08") && 
                ((tuple.dis=="DIS") || (tuple.dis=="PRE") || (tuple.dis=="REG") ||(tuple.dis=="DEP")) 
              )
            )
          cb(null);
         else {
          //check if assigned location is reserved (already exists) and delete  it 
          MrnLocation.findOne({ 
                                $and: [{ mrn: { $ne : tuple.mrn } },{ location: tuple.new_location },  
                                                                    { room: tuple.new_room }, {room: {$ne: "Null"}}, 
                                                                    { bed: tuple.new_bed }, {bed: {$ne: "Null"}}, 
                                      ] 
                              },
           function (err, doc) {
             if (err){
               console.error("error in reserved location", err);
               return cb(err);
             }

             if (doc==null)//not found anything
               cb(null);
             else 
             { //found a reserved location
               var error_tuple = tuple._id+" | "+ tuple.mrn+" replaces "+ doc.mrn+ " in location:"+tuple.new_location + "/" + tuple.new_room +"/" + tuple.new_bed +". Removing duplicate document...";
               console.info("Duplicate insertion in message id : ", error_tuple);
              
               doc.remove(function (err){
                  if (err)
                    console.error("error in duplicate document removal-1!");
               });             
               cb(null);
             }
                            
           });
          }
        },        
        function(cb){
          //ignore message cases
          if ( (tuple.new_location=="not_defined" ) || (tuple.new_room=="not_defined") || (tuple.new_bed=="not_defined") ||
               (tuple.event_type == "A11") || (tuple.event_type == "A38") || (tuple.event_type == "A03") ||                 
                 ( (tuple.event_type =="A08") && 
                   ((tuple.dis=="DIS") || (tuple.dis=="PRE") || (tuple.dis=="REG") ||(tuple.dis=="DEP")) 
                 )
             )
            cb(null);
          else {
           dbTuple.save(function (err) {
            if (err){
              if(err.code === 11000){
                console.info("11000  --- Already created tuple for %s. Updating just the location and account no.", dbTuple.mrn);
                MrnLocation
                  .update({mrn: dbTuple.mrn}, 
                          {"$set": 
                              {account_no: dbTuple.account_no, location: dbTuple.location, bed: dbTuple.bed, room: dbTuple.room}
                          })
                  .exec(function(err){
                    if(err)
                      return cb(err);
                    cb(null);
                  });
              }else{
                cb(err);
              }
              
            }else{
              cb(null);  
            } 
           }); 
          }
        }
        ], function(err){
          if(err)
            throw err;
          callback();
        });
      }
      else if (recs.length==1){//if record exists, update existing mrn with new data
        var update_tuple = tupleUpdater(tuple.event_type, tuple, recs[0]);    //tuple may be changed for some events
        
        async.series([
          function(cb){
           if ( (tuple.new_location=="not_defined" ) || (tuple.new_room=="not_defined") || (tuple.new_bed=="not_defined") ||
                 ((tuple.event_type =="A08") && 
                    ((tuple.dis=="DIS") || (tuple.dis=="PRE") || (tuple.dis=="REG") ||(tuple.dis=="DEP")) 
                 )
              )
              cb(null);
           else {
              //check if assigned location is reserved (already exists) and delete it 
              MrnLocation.findOne({ 
                                    $and: [{ mrn: { $ne : tuple.mrn } },{ location: update_tuple.location },  
                                                                        { room: update_tuple.room }, {room: {$ne: "Null"}}, 
                                                                        { bed: update_tuple.bed }, {bed: {$ne: "Null"}}, 
                                          ] 
                                  },
               function (err, doc) {
                 if (err){
                   console.error("error in reserved location", err);
                   return cb(err);
                 }

                 if (doc==null)//not found anything
                   cb(null);
                 else 
                 { //found a reserved location
                   var error_tuple = tuple.id+" | "+ tuple.mrn+" replaces "+ doc.mrn+ " in location:"+update_tuple.location + "/" + update_tuple.room +"/" + update_tuple.bed+". Removing duplicate document...";
                   console.info("Duplicate insertion in message id : ", error_tuple);
                                  
                   doc.remove(function (err){
                      if (err)
                        console.error("error in duplicate document removal-2!");
                   });              
                   cb(null);
                 }
                                
                });
             }
          },         
           function(cb){
            if ( (tuple.new_location=="not_defined" ) || (tuple.new_room=="not_defined") || (tuple.new_bed=="not_defined") ||
                  ((tuple.event_type =="A08") && 
                     ((tuple.dis=="DIS") || (tuple.dis=="PRE") || (tuple.dis=="REG") ||(tuple.dis=="DEP")) 
                  )
               )
             cb(null);
            else {
               MrnLocation.findOne({ mrn: tuple.mrn }, function (err, doc) {
                  if (err) {
                    console.error("error in storeTuple: MrnLocation.update", err);
                    //console.error("err1", err); 
                    return cb(err);
                  }

                if (doc==null)//not found anything
                   cb(null);  
                else{
                  doc.account_no = update_tuple.account_no;  
                  doc.location = update_tuple.location;
                  doc.room = update_tuple.room;
                  doc.bed = update_tuple.bed ;
                  doc.valid = update_tuple.valid;  
                  doc.save();  
                  cb(null);   
                } 
                     	           
                });                                     
            }
           }
          ], function(err){
            if(err) {
              console.error("error2", err);
              throw err;
            }
            callback();
          });
      }   
      //console.info("log tuple=", tuple);  
      
    });
}

function readLogCollection(cb){  
  var records, query; 
  var limitRecs = config.limitRecs;

  if (maxID == null) //if the database is not populated yet initialize id
      query = {};
  else
      query = { "_id": { $gt: maxID } };
  
  console.info("phase 1");
  LogLocation.find(query)
    .sort({ "_id": 1 })
    .limit(limitRecs) 
    .exec(function (err, logrecs) {
      if (err)
        return console.error(err);       
      console.info("Log query records = ", logrecs.length);
      records = logrecs;
      if (records.length >0)      
          maxID = records[records.length-1]._id;
      else 
      {
        console.log("Finished reading, exiting...")
        process.exit(10);
      }   
      cb(records)
    });
}

function executeForAllRecords(records, cb){
  console.info("phase 2");  
  async.forEachOfSeries(records, 
    function (tuple, index, callback) {                
      storeTuple(tuple, index, callback);
    }, function (err) {
      if (err) return cb(err);
      console.info("Completed for now.");
      cb(null);
    });
}

function readLogCollectionCallBack(records){
  executeForAllRecords(records, executeForAllRecordsCallBack);      
}

function executeForAllRecordsCallBack(){
  readLogCollection(readLogCollectionCallBack);
}

function loadModels(cb){
  var rootDir = __dirname
  , modelDir = path.join(rootDir, "models")
	, modelFiles = fs.readdirSync(modelDir);
  
  u.each(modelFiles, function(filePath){
    require(path.join(modelDir, filePath)); 
  });
  cb(null);
}

//////////////////////////////////////////////
 // var minutes = config.minutesLog;
 // var the_interval = minutes * 60 * 1000;

   //define db connection
  db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  
  db.once('open', function (callback) {
    console.log ( "yay client connected to mongo db!");    
    //console.info ('Reading %s logs every %s minutes', config.limitRecs, minutes);
    console.info ('Reading chunks of logs with size ', config.limitRecs);

    loadModels(function(){        
       console.info("Models loaded.");
    });
    MrnLocation = mongoose.model("MrnLocation");
    LogLocation = mongoose.model("Location_log");
              
    readLogCollection(readLogCollectionCallBack);       
  });

       