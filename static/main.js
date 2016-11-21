// This alert was to test to see if the JavaScript was loaded :)
// alert("Hello World")  <- Hello World was loaded and worked

$(document).ready(function() {

	// Initialize collapse button
	$(".button-collapse").sideNav();
	// Initialize collapsible (uncomment the line below if you use the dropdown variation)
	//$('.collapsible').collapsible();

	function validateForm() {
	    var x = document.forms["myForm"]["email"].value;
	    if (x == "") {
	       console.log("Name must be filled out");
	        return false;
	    }
	}



})