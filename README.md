# adtMessages

Node Application for manipulating adt messages in Humber hospital food services

## Prerequisites

[1] Install node

[2] Install mongodb 2.6

[3] cp /config/config-example.js /config/config.js


## Usage

[1] node app2.js for initiating adt server.
    
    The server will read after a predefined interval the adt messages from the hl7 collection
    or after a call to it, and return the medical record number for a spacified patient location given
    in the API call.

[2] node logParser.js for reading the whole log database again faster, after update


## Note

[1] This application runs through the Humber Hospital VPN network

[2] Web folder refers to the client web application for viewing the adt message logs



