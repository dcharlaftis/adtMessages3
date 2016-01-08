var mongoose = require("mongoose");

var schema = {
  mrn : {type: String},
  account_no : {type: String},
  message_id: {type: String},
  control_id: {type: String},
  event_type: { type: String },
  description: { type: String },
  event_time: {type:String},
  old_location: {type: String},
  old_bed: {type: String},
  old_room: {type: String},	
  new_location: {type: String},
  new_bed: {type: String},
  new_room: {type: String},
  dis: {type: String},
  processingId: {type: String},	
  occured_time: {type: String},
  accomodationStatus: {type: String},
  prior_location: {type: String},
  prior_bed: {type: String},
  prior_room: {type: String}, 
  patientType: {type: String},
  dischargeDisposition: {type: String},
  patientStatus: {type: String},
  accomodationCode: {type: String},
  priorAccountNumber: {type: String},
  priorMRN: {type: String}  
};
var collectionName = "location_log_collection";
var logSchema = mongoose.Schema(schema, {collection: collectionName} );

var logModel = mongoose.model("Location_log", logSchema);