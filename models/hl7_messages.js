var mongoose = require("mongoose");

//define adt database schema
var schema = {
  header: {},
  segments: {}
}
var collectionName = "hl7_messages";

var adtSchema = mongoose.Schema(schema, {collection: collectionName});
var adtModel = mongoose.model('Hl7Messages', adtSchema);