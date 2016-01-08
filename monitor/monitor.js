Tail = require('tail').Tail;
nodemailer = require('nodemailer');
var config = require("./config-monitor.js");

var fileToTail = config.fileToWatch;
var lineSeparator = "\n";
var fromBeginning = false;
var watchOptions = {}; // as per node fs.watch documentations 

var smtpTransport = nodemailer.createTransport("SMTP", {
    service: "Gmail",
    auth: {
        user: config.user,
        pass: config.pass
    }
});

var date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
tail = new Tail(fileToTail, lineSeparator, watchOptions, fromBeginning);
var logMessages = 0; 

//send email to username
function notify(data) {
    var mailOptions = {
        from: config.from,
        to: config.to, // comma separated list of receivers
        subject: config.subject, // Subject line
        html: '<b>' + data + '</b>' // html body};
     }
    smtpTransport.sendMail(mailOptions, function(err) {
        if (err)
            console.log("ohhh", err);
        else
        	console.log('Message sent.');
	});
}

    tail.watch();
    console.log("Monitoring file " + fileToTail);

    tail.on("line", function(data) {
        //if the output string contains string 'error' 
        if ((data.indexOf(config.stop_pattern) !== -1) ||
            (data.indexOf(config.restart_pattern) !== -1) ||
            (data.indexOf(config.start_pattern) !== -1)
        ) {
            console.log("[%s]: %s", date, data);
            notify("[" + date + "]: " + data);
        }
        //calculate log tuples
        if (data.indexOf(config.adtMessage_pattern) !== -1)
            logMessages++;                  
    });

    tail.on("error", function(error) {
        console.log('oh, ERROR: ', error);
    });
      
    /////////////////////////    

    //also, send report every n hours
    var hours = config.hours;
    var interval = hours * 60 * 60 * 1000; //in millisecs 
    
    setInterval(function(){ 
        var date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');       
        var mailOptions = {
            from: config.from,
            to: config.to, // comma separated list of receivers
            subject: date + ": "+config.report_subject, // Subject line
            html: '<p><b>' + " Report for date " + date +'</b></p>' +
                  '<p>'   + "Log messages parsed for the last " + hours + " hours = "+ logMessages + '</p>'
        }
        //initialize again logMessages
        logMessages = 0;

        smtpTransport.sendMail(mailOptions, function(err) {
            if (err)
                console.log("ohhh2", err);
            else
                console.log('Report message sent.');
            });
    }, interval );