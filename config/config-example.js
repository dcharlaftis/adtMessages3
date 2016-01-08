"use strict";

module.exports = {
  "port": "3000",
 // "webAdtPort": "3000",
  "dbConnectionString": "mongodb://panacea:panacea01@localhost:27017/adt_msg_store",
  "minutes": "15",
  //read limitRecs records every minutesLog minutes (for log parser)
  "minutesLog" :"0.6",
  "limitRecs":"13000" 
};