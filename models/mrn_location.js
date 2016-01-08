var mongoose = require("mongoose");

var schema = {
  mrn : {type: String},
  account_no : {type: String},
  location: {type: String},
  bed: {type: String},
  room: {type: String },
  valid: {type: String }	
};

var collectionName = "mrn_location"
var mrnSchema = mongoose.Schema(schema, {collection: collectionName, autoIndex:true} );
mrnSchema.index({location:1, bed:1, room:1}, {unique: true});
//mrnSchema.on("index", function(e){console.info(e)});

var mrnLocModel = mongoose.model("MrnLocation", mrnSchema);