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
//var rootPath="./logs";
var config = require("./config/config.js");

//mongoose.connect('mongodb://panacea:panacea01@localhost:27017/adt_msg_store');
mongoose.connect(config.dbConnectionString);


var db;
var MrnLocation ;
var LogLocation ;
var Hl7Messages ;
var leave_me_alone = false;
var do_not_disturb = false;

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

function WriteFile(tuple, continuation) {
    var str = {
        mrn: tuple.mrn, 
        message_id: tuple.message_id,
        event_type: tuple.event_type ,
        description: eventTranslator(tuple.event_type),
        event_time: tuple.event_time ,
        old_location: tuple.old_location ,
        old_bed : tuple.old_bed,
        old_room : tuple.old_room ,
        new_location : tuple.new_location,
        new_bed: tuple.new_bed ,
        new_room: tuple.new_room
    }          
 //   console.log(str);
    continuation(null); 
}

function extractTupleFromRecord(record){
  var event_time ,mrn, location, room, bed, event_type, id, control_id, account_no, dis;
  var processingId, occured_time, accomodationStatus, prior_location, prior_room, prior_bed, patientType;
  var dischargeDisposition, patientStatus, accomodationCode, priorAccountNumber="Null", priorMRN="Null";
  
  try{ 
        event_type=  record.header.fields[6].value[[0][0]][1].value[0];
     }
  catch (err){
     event_type = "A000"; //malformed message
     console.error ("event-type malformation error: 1" , err.message); 
  }   
  
  try{
      control_id = record.header.fields[7].value[0][0].value[0];
  }
  catch (err){
     control_id="000000"; //malformed message
     console.error ("control_id malformation error" , err.message) ;
  } 

  try{
      account_no = record.segments[1].fields[17].value[0][0].value[0];
  }
  catch (err){
     account_no="00000000"; //malformed message
     console.error ("account_no malformation error" , err.message) ;
  } 

  try{
      processingId = record.header.fields[8].value[0][0].value[0];
  }
  catch (err){
     processingId="Null"; //malformed message     
  } 

  ////////

  id = record._id;

  for (var j=0; j<record.segments.length; j++ ){

    if (record.segments[j].name == "EVN"){
      try{
        event_time= record.segments[j].fields[1].value[0][0].value[0];
      }
      catch (err){
         event_time="000000"; //malformed message
         console.error ("event_time malformation error" , err.message) ;
      } 
      try{
      occured_time = record.segments[j].fields[5].value[0][0].value[0];
      }
      catch (err){
         occured_time="Null"; //malformed message        
      }   
    }
       
    if (record.segments[j].name == "PID"){
      try{
         mrn= record.segments[j].fields[2].value[0].value[0][0].value[0];
      }
      catch (err){
         mrn="000000" ;//malformed message
         console.error ("mrn malformation error" , err.message) ;
      }   
    }

    if (record.segments[j].name == "PV2"){
      try{
         accomodationCode = record.segments[j].fields[1].value[0][1].value[0];
      }
      catch (err){
         accomodationCode="Null"; //malformed message         
      }

    }

    if (record.segments[j].name == "MRG"){
      try{
         priorAccountNumber = record.segments[j].fields[2].value[0][0].value[0];
      }
      catch (err){
         priorAccountNumber="Null"; //malformed message         
      }
      try{
         priorMRN = record.segments[j].fields[0].value[0][5].value[0];
      }
      catch (err){
         priorMRN="Null"; //malformed message         
      }


    }
       
    if (record.segments[j].name == "PV1"){
      try{
        patientStatus = record.segments[j].fields[40].value[0][0].value[0];
      }
      catch (err){
         patientStatus="Null"; //malformed message         
      }

      try{
        dischargeDisposition = record.segments[j].fields[35].value[0][0].value[0];
      }
      catch (err){
         dischargeDisposition="Null"; //malformed message         
      }
      try{
        patientType = record.segments[j].fields[17].value[0][0].value[0];
      }
      catch (err){
         patientType="Null"; //malformed message         
      }

      try{
        accomodationStatus = record.segments[j].fields[1].value[0][0].value[0];
      }
      catch (err){
         accomodationStatus="Null"; //malformed message         
      }

      try{
        dis = record.segments[j].fields[40].value[0][0].value[0];
      }
      catch (err){
         dis="Null"; //malformed message         
      } 

      try{
         location = record.segments[j].fields[2].value[0][0].value[0];
      }
      catch (err){
         location="000000" ;//malformed message
         console.error ("location malformation error" , err.message) ;
      }   
      
      if (record.segments[j].fields[2].value[0].length >1)
        room = record.segments[j].fields[2].value[0][1].value[0];
      else 
        room ="not_defined";
      if (record.segments[j].fields[2].value[0].length >2)
        bed = record.segments[j].fields[2].value[0][2].value[0]; 
      else 
        bed ="not_defined" ;  

      try{
         prior_location = record.segments[j].fields[5].value[0][0].value[0];
      }
      catch (err){
         prior_location="not_defined" ;//malformed message         
      }   
      
      if (record.segments[j].fields[5].value[0].length >1)
        prior_room = record.segments[j].fields[5].value[0][1].value[0];
      else 
        prior_room ="not_defined";
      if (record.segments[j].fields[5].value[0].length >2)
        prior_bed = record.segments[j].fields[5].value[0][2].value[0]; 
      else 
        prior_bed ="not_defined" ;  


    }   
  }
  return {
    id: id,
    control_id: control_id,
    mrn: mrn,
    account_no: account_no,
    event_time: event_time,
    event_type: event_type,
    location: location,
    room: room,
    bed: bed,
    dis: dis, 
    processingId:processingId,
    occured_time: occured_time, 
    accomodationStatus: accomodationStatus, 
    prior_location :prior_location, 
    prior_room :prior_room, 
    prior_bed: prior_bed, 
    patientType: patientType,
    dischargeDisposition: dischargeDisposition, 
    patientStatus : patientStatus, 
    accomodationCode: accomodationCode, 
    priorAccountNumber: priorAccountNumber,
    priorMRN: priorMRN
  }
}

function tupleUpdater(event, tuple, rec){
  var update_tuple;
  //if event type is referred to cancel admit(A11) or cancel pre-admit(A38) or discharge - A03
  //mrn record should set the valid key to zero 
  //ONLY IF the rec.account_no (from mrn collection in database) == tuple.account_no
  

  if ((event == "A11") || (event == "A38") || (event == "A03")) {
    if (rec.account_no == tuple.account_no){
      console.log ("Erasing account %s, mrn %s with message %s control id = %s", rec.account_no, tuple.mrn, event, tuple.control_id );

      tuple.location = "Null_for_"+tuple.mrn; //for uniqueness in deletions
      tuple.bed = "Null";
      tuple.room = "Null"; 

      update_tuple = {
        account_no: tuple.account_no,
        location: tuple.location,
        bed: tuple.bed ,
        room: tuple.room,
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
      location: tuple.location,
      bed: tuple.bed,
      room: tuple.room,
      valid: "1"
    };
  return update_tuple;
}

function storeTuple(tuple, record, index, callback){
  MrnLocation.find({ mrn: tuple.mrn } ,function (err, recs) {
  	//console.info("recssss.lengthhh",recs.length);
    if (err) {    
      console.error("error in storeTuple: MrnLocation.find", err);
      return callback(err);
      }
    else if (recs.length==0) { //if mrn does not exist in there add it along with location      
      var dbTuple = new MrnLocation({
        mrn: tuple.mrn,
        account_no: tuple.account_no,
        location: tuple.location,
        bed: tuple.bed,
        room: tuple.room,
        valid: "1" //if record is not deleted by some message
      });
      
      var logTuple = new LogLocation({
        mrn : tuple.mrn,
        account_no: tuple.account_no,
        message_id: tuple.id,
        control_id: tuple.control_id,
        event_type: tuple.event_type,
        description: eventTranslator(tuple.event_type),
        event_time: tuple.event_time,
        old_location: "Null_for_" + tuple.mrn, //current field did not exist in database 
        old_bed: "Null",
        old_room: "Null", 
        new_location: tuple.location,
        new_bed: tuple.bed,
        new_room: tuple.room,
        dis: tuple.dis,
        processingId: tuple.processingId,
        occured_time: tuple.occured_time, 
        accomodationStatus: tuple.accomodationStatus, 
        prior_location: tuple.prior_location, 
        prior_room: tuple.prior_room, 
        prior_bed: tuple.prior_bed, 
        patientType: tuple.patientType,
        dischargeDisposition: tuple.dischargeDisposition, 
        patientStatus: tuple.patientStatus, 
        accomodationCode: tuple.accomodationCode, 
        priorAccountNumber: tuple.priorAccountNumber,
        priorMRN: tuple.priorMRN 
      });
      async.series([
        function(cb){
         if ( (tuple.location=="not_defined" ) || (tuple.room=="not_defined") || (tuple.bed=="not_defined") ||
               ((tuple.event_type =="A08") && 
                ((tuple.dis=="DIS") || (tuple.dis=="PRE") || (tuple.dis=="REG") ||(tuple.dis=="DEP")) 
               )
            )
          cb(null);
         else {
          //check if assigned location is reserved (already exists) and delete  it 
          MrnLocation.findOne({ 
                                $and: [{ mrn: { $ne : tuple.mrn } },{ location: tuple.location },  
                                                                    { room: tuple.room }, {room: {$ne: "Null"}}, 
                                                                    { bed: tuple.bed }, {bed: {$ne: "Null"}}, 
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
               var error_tuple = tuple.id+" | "+ tuple.mrn+" replaces "+ doc.mrn+ " in location:"+tuple.location + "/" + tuple.room +"/" + tuple.bed +". Removing duplicate document...";
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
          logTuple.save(function (err) {
            if (err){
              console.error("error in storeTuple: logTuple.save 1", err);
              return cb(err);
            }
            cb(null);
          });
        },
        function(cb){
          WriteFile(logTuple, function(err){
            if(err)
              return cb(err);
            cb(null);
          });  
        },
        function(cb){
          //ignore message cases
          if ( (tuple.location=="not_defined" ) || (tuple.room=="not_defined") || (tuple.bed=="not_defined") ||
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
        var logTuple = new LogLocation({
          mrn : tuple.mrn,
          account_no: tuple.account_no,
          message_id: tuple.id,
          control_id: tuple.control_id,
          event_type: tuple.event_type,
          description: eventTranslator(tuple.event_type),
          event_time: tuple.event_time,
          old_location: recs[0].location, //current field did not exist in database 
          old_bed: recs[0].bed,
          old_room: recs[0].room, 
          new_location: update_tuple.location,
          new_bed: update_tuple.bed,
          new_room: update_tuple.room,
          dis: tuple.dis,
          processingId: tuple.processingId,
          occured_time: tuple.occured_time, 
          accomodationStatus: tuple.accomodationStatus, 
          prior_location: tuple.prior_location, 
          prior_room: tuple.prior_room, 
          prior_bed: tuple.prior_bed, 
          patientType: tuple.patientType,
          dischargeDisposition: tuple.dischargeDisposition, 
          patientStatus: tuple.patientStatus, 
          accomodationCode: tuple.accomodationCode, 
          priorAccountNumber: tuple.priorAccountNumber,
          priorMRN: tuple.priorMRN   
        });
        async.series([
          function(cb){
           if ( (tuple.location=="not_defined" ) || (tuple.room=="not_defined") || (tuple.bed=="not_defined") ||
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
            logTuple.save(function (err) {
              if (err){
                console.error("error in storeTuple: logTuple.save 2", err);
                return cb(err);
              }
              cb(null);
            });
          },
          function(cb){
            WriteFile(logTuple, function(err){
              if(err)
                return cb(err);
              cb(null);
            });  
          },
           function(cb){
            if ( (tuple.location=="not_defined" ) || (tuple.room=="not_defined") || (tuple.bed=="not_defined") ||
                  ( (tuple.event_type =="A08") && 
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
      console.info("log tuple=", logTuple);  
      
    });
}


function getLatestLogMessage(cb) {
  LogLocation.findOne()
  .sort('-message_id')
  .exec(function (err, item) {
    if (item == null) {
      cb(null);
      console.info("having zero records...");
    }               
    else {
      console.info("maxxxxxxxx", item.message_id);
      cb(item.message_id);            
    }                
  });       
}

function readAdtDatabase(maxID, cb){
  //fetch adt data from database ordered by id (the timestamp is included in the id) with cronological order 
  var records, query;
  
  if (maxID == null) //if the database is not populated yet initialize id
      query = {};
  else
      query = { "_id": { $gt: maxID } };

  Hl7Messages.find(query)
    .sort({ "_id": 1 })
    .limit(1000) 
    .exec(function (err, adts) {
      if (err)
        return console.error(err);
      console.info("adt query records = ", adts.length);
      records = adts;
      cb(records)
    });
}

function executeForEachRecord(cb2){
  MrnLocation = mongoose.model("MrnLocation");
  LogLocation = mongoose.model("Location_log");    
  Hl7Messages = mongoose.model("Hl7Messages");
  async.waterfall([
    function(cb){
      console.info(" phase 1");	
      getLatestLogMessage(function(latestId){
        cb(null, latestId);
      });
    },
    function(latestId, cb){
    	 console.info("phase 2");	
      readAdtDatabase(latestId, function(records){
        cb(null, latestId, records);
      });
    },
    function(latestId, records, cb){
    	 console.info("phase 3");	
      async.forEachOfSeries(records, 
        function (record, index, callback) {
          var tuple = extractTupleFromRecord(record);
          storeTuple(tuple, record, index, callback);
        }, function (err) {
          if (err) return cb(err);
          cb(null, records)
        });
    }], 
    function (err, results) {
      if (err) { throw err; }
      //res.send("completed!");
      cb2(null);
    });
  
}

function getMRN(res, location, room, bed) {
  MrnLocation.find({ $and: [{ location: location }, { room: room },{ bed: bed } ] } , function (err, recs) {
    if (err)
      console.error("error0", err);
    else if (recs.length == 0) {
      res.json({'MRN': null, 'error':'mrn not found for requested location'});
    }
    else if (recs.length == 1) {
      res.json({ 'MRN': recs[0].mrn });
    }
    else if (recs.length > 1) {
      res.json({'MRN': null, 'error':'multiple mrns assigned for requested location'});
    }
  });
}

//Include other web adt server
app.use('/web', express.static('web'));
app.use('/webadt', require('./webAdtServer'));
 
///////////////////////////////////////////////////
app.get('/:location/:room/:bed', function (req, res) {
    
  var req_location = req.params.location;
  var req_room = req.params.room;
  var req_bed = req.params["bed"]; 
  var waitmilliSecs = 1;   
     
     //wait 20 secs if another timeout check is in progress
     if (leave_me_alone === true)
        waitmilliSecs = 20000;

        setTimeout(function(){
          do_not_disturb = true; //for concurrent requests at the end of timeout
          executeForEachRecord(function(){
            getMRN(res,req_location, req_room, req_bed );
            console.info("completed");
             do_not_disturb = false;
          });
        }, waitmilliSecs);      
 
});

function loadModels(cb){
  var rootDir = __dirname
  , modelDir = path.join(rootDir, "models")
	, modelFiles = fs.readdirSync(modelDir);
  
  u.each(modelFiles, function(filePath){
    require(path.join(modelDir, filePath)); 
  });
  cb(null);
}

//----------------------
var server = app.listen(config.port, function () {
  var host = server.address().address;
  var port = server.address().port;
  var minutes = config.minutes;
  var the_interval = minutes * 60 * 1000;
  
  console.info('Adt app listening at http://%s:%s', host, port);
  console.info ('Checks made every %s minutes', minutes);

   //define db connection
  db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  
  db.once('open', function (callback) {
    console.info( "yay connected to mongo db!");
    loadModels(function(){
      setInterval(function() {//executes every minutes minutes
        if (do_not_disturb ===false){ //unless a request is happening at the same time
          leave_me_alone=true;
          console.info("I am doing my "+ minutes+" minutes check");
          executeForEachRecord(function(){
            console.info("completed");
            leave_me_alone = false;
          });
        }
      }, the_interval);
    });
  });  
});