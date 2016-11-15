/*  ============================================================================================
    ********************************************************************************************
    	Open Hours from Google Calendar 
    ********************************************************************************************

		University of St. Thomas Libraries - clk
		www.stthomas.edu/libraries
		
		version: 0.1.2-2016.11.15
		https://github.com/ustlibraries/openhours  - Repository
	
		Released under Creative Commons Attribution 4.0 International license (CC BY)
		https://creativecommons.org/licenses/by/4.0/
		
		The code with it's heavy use of comments is provided as an educational resource
	
    ********************************************************************************************	
*/

(function( $ ) {

/* ********************************************************************************************
   	Local variables
*/
	
    /* Just an ID--prevents unncessary hair pulling */
	var version = "0.1.2-20161115"; // just a manual version number for debugging: "Is it loading the code I *thought* I uploaded?"
		
	/* Settings (Read/Write) */
	var silent = false; // does debug() output to console.log?
	var apiKey = "";
	var locationCalendar = {};
	var timeOffset = "-06:00"; // the offset of the calendar, TODO: make sure this works in all timezones
	var testMode = false;
	
/* ********************************************************************************************
   	Toolbox of helpers
*/
	 
	/* ========================================================================================
		debug()

		If not silenced, outputs text pased to it to console.log 
		
		Need a line number? In your code use debug(yourmessage + " - Line:"+ (new Error()).lineNumber ] );

		This function has a companion variable: silent
	======================================================================================== */
	var debug = function( text ) {
		
		// as long as we aren't silenced (silent === false)...
		if( !silent ) {
			var d = new Date();
			var ts = d.getHours() +":"+ d.getMinutes() +":"+ d.getSeconds() +"."+ d.getMilliseconds();
			console.log("OPENHOURS ["+ts+"] : " + text);
		}
	};  

/* ********************************************************************************************
   	Setters for our settings
*/

	/* ========================================================================================
		setSilence()
	======================================================================================== */	
	var setSilence = function(silence){
		if( silence ) {
			debug("Silenced");
			silent = true;
		} else {
			silent = false;
			debug("Unsilenced");	
		}
	}

	/* ========================================================================================
		setCalendars()
	======================================================================================== */	
	var setCalendars = function ( calendarsArray ) {
		locationCalendar = calendarsArray;
	}

	/* ========================================================================================
		setKey()
	======================================================================================== */		
	var setKey = function ( key ) {
		apiKey = key;
	}

	/* ========================================================================================
		setTimeOffset()
	======================================================================================== */		
	var setTimeOffset = function ( offset ) {
		timeOffset = offset;
	}

/* ********************************************************************************************
   	Local Functions
*/	

	/* ========================================================================================
		listUpcomingHours()
		
		Cycle through the locations that need hours listed on the page 
	======================================================================================== */		
	var listUpcomingHours = function() {
		$("#openhours div[data-openhours-location]").each( function() {
			listLocationHours( $(this) );
		});
	};
	
    /* ========================================================================================
		listLocationHours()
		
		Print the summary and start datetime/date of the location
	======================================================================================== */	
	var listLocationHours = function(elem) {
		
		var location = $(elem).attr("data-openhours-location");
		
		debug("Getting hours for: " + location);

		$(elem).html("-"); // put a placeholder in ASAP so page doesn't jump later

		// get the current date/time
		var now = new Date();
		var month = now.getMonth(); //months from 0-11
		var day = now.getDate();
		var year = now.getFullYear();
		var dayOfWeek=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
		
		// how many are we going to list? Is it just today or the next 7 days?
		var maxNum = 1;
		if ($(elem).hasClass("dailyHours")) {
			maxNum = 7;
		}

		// create the Google calendar request object
		var request = gapi.client.calendar.events.list({
		  'calendarId': locationCalendar[location],
		  'timeMin': (new Date(year,month,day)).toISOString(),
		  'showDeleted': false,
		  'singleEvents': true,
		  'maxResults': maxNum,
		  'orderBy': 'startTime'
		});
	
		// execute the request and give it a function to process
		request.execute(function(resp) {
			var events = resp.items;

			var hoursTextNode = document.createTextNode('No Hours Listed'); // default	
			
			// clear out any placeholders
			$(elem).html("");
			
			// if items are found
			if (events.length > 0) {
				// process each of the events
				for (var i = 0; i < events.length; i++) {
					
					var span = document.createElement('span');  // this is the tag the hours will reside in
					var eventItem = events[i];
					var whenStart = eventItem.start.dateTime;
					var whenEnd = eventItem.end.dateTime;
					
					// If no start time is specfied, give it one
					if (!whenStart) {
						whenStart = eventItem.start.date + "T00:00:00"+timeOffset;
					}
					
					// If no end time is specfied, give it one
					if (!whenEnd) {
						whenEnd =  eventItem.start.date + "T23:59:00"+timeOffset;
					}
					
					var eventStart = new Date(whenStart);
					var eventEnd = new Date(whenEnd);

					debug(location + " Event: " + whenStart + " - " + whenEnd);
					
					var dateString = dayOfWeek[ eventStart.getDay() ] + ' ' +  (eventStart.getMonth()+1) + '/' + eventStart.getDate();
		
					// if it is past hours, mark it as closed
					if ( ( eventStart.getDate() === now.getDate() ) 
						   && ( eventEnd.getTime() < now.getTime() ) ) { 
						dateString += ' - ' + "Closed for the day";
					} else { // still open, or will be open
						dateString += ' - ' + eventItem.summary;
					}

					// put the hours into the text node for placement within the span
					hoursTextNode = document.createTextNode(dateString);
					
					// put the text in the span tag, then add the span tag
					$(span).append(hoursTextNode);		
					$(elem).append(span); 				
				}
			} else { 					
				// No events found, put the default text out there
				var span = document.createElement('span');
				$(span).append(hoursTextNode);
				$(elem).append(span); 
			}
			
	
		});

	
	};	
	
	/* ==========================================================================
		This is the jQuery plugin that can be called to do the load, config, etc
		
		It takes an action and optional parameters	
		
		Usage:
		
		// you MUST set your own apikey and calendar(s)
		$(document).ready(function() {
			$(document).openhours("config", {apikey: "yourapikeykljjasdfjjwasfasf", calendar: { MAIN:"youremail@gmail.com" } } );
		});
		
		// mulitple location example:
		$(document).ready(function() {
			$(document).openhours("config", {apikey: "yourapikeykljjasdfjjwasfasf", calendar: 
				{ MAIN:"youremail@gmail.com", STP: "asdfasdfr8asdfasdfasf3k@group.calendar.google.com" }
			} );
		});
	*/
	
	 $.fn.openhours = function (action, param ) {
	
		switch (action.toLowerCase()) {
			case "load":
				debug("Version: " + version);
				// make sure we have a key and calendar
				if(apiKey !== "" && Object.keys(locationCalendar).length > 0) {		
					// Load Google Calendar client library. List upcoming events once client library is loaded.
					gapi.client.setApiKey(apiKey);
					gapi.client.load('calendar', 'v3').then(listUpcomingHours);
				} else {
					silent = false; // this is important to hear
					debug("Google Calendar API Key and Calendar(s) not set! Please read Open Hours doc for more information.");
				}
				break;
			case "config":
				if ( typeof param.silence !== 'undefined' ) { setSilence(param.silence); }
				if ( typeof param.calendar !== 'undefined' ) { setCalendars(param.calendar); }
				if ( typeof param.apiKey !== 'undefined' ) { setKey(param.apiKey); }
				if ( typeof param.timeOffset !== 'undefined' ) { setTimeOffset(param.timeOffset); }
				break;
			case "debug":
				if ( typeof param.message !== 'undefined' ) { debug(param.message);	}
				break;
			default:
				debug("Unknown Command for openhours(): "+ action);
		}

	};
	
	
}( jQuery ));

/* **************************************************************************
	Callback for google API
	
	It needs to be out here so that the Google api can use it as a callback
*/
var init_openhours = function() {
	$(document).openhours("debug", {message: "Load called"}); // we make the call to e
	$("#openhours").openhours("load");
}

/* **************************************************************************
	Kick things off when the document is ready - only if there is a placeholder found
	
	If there is then load the google api
*/
$(document).ready( function() {
	if( $("#openhours").size() ) {
		$(document).openhours("debug", {message: "Placeholder for Open Hours Found"});
		
		// add calendar API
		var s=document.getElementsByTagName('script')[0];
		var sc=document.createElement('script');
		sc.type='text/javascript';
		sc.async=true;
		sc.src='https://apis.google.com/js/client.js?onload=init_openhours'; // google api with the callback to init_openhours
		s.parentNode.insertBefore(sc,s);
	}
});