
 Client implementation for adt messages
=========================================== 

 USAGE:
 ======
 $node client.js <arg1> <arg2> 
 
 where:
 ------
 <arg1> = -lrbm (for LocationRoomBedMrn)  
 <arg2> = date (format example: yyyymmdd or yyyymm or yyyy)  
 example: $node client.js -lrbm 20151105 
 or
 <arg2> = -di
 <arg3> = [date_from , date_to]  //must have format yyyymmdd
 example: $node client.js -lrbm -di 20151005 20151102 

  OR

 <arg1> = -mh (for Mrn History)
 <arg2> = an MRN (format example: H000591954)
 <arg3> = date (format example: yyyymmdd or yyyymm or yyyy) 
 example: $node client.js -mh H000591954 20151105
 or
 <arg3> = -di
 <arg4> = [date_from , date_to]  //must have format yyyymmdd
 example: $node client.js -mh H000591954 -di 20151005 20151102

  OR

 <arg1> = -bh (for Bed History)
 <arg2> = [location, room, bed ]
 <arg3> = date (format example: yyyymmdd or yyyymm or yyyy)
 example: $node client.js -bh W07ECARD 0737 A 20151105
 or
 <arg3> = -di
 <arg4> = [date_from , date_to]  //must have format yyyymmdd
 example: $node client.js -bh W07ECARD 0737 A -di 20151005 20151102

NOTE:
=====
output files are written to csv folder.