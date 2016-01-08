"use strict";

module.exports = {
  //mailer info
  "user": "kostas@dotbydot.gr",
  "pass": "kostas01",
  "from": "kostas@dotbydot.gr",
  "to": ["d.charlaftis@dotbydot.gr", "l.goussis@dotbydot.gr", "v.antoniou@dotbydot.gr"],
  "subject": "adtMessages server status changed.",
  "report_subject": "ADT monitor report",
  
  //error patterns
  "stop_pattern": "detected script was killed by signal",
  "restart_pattern": "Script restart attempt",
  "start_pattern": "Adt app listening at http",
  "adtMessage_pattern": "log tuple=",

   //log file to watch
  "fileToWatch":"/home/maint/.forever/adtMessages",
   
   //send report every  n hours
  "hours":"24"
};