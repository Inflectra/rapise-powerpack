/**
 * Universal incrementer
 * This function expects to get a string that ends with a number
 * Such as "Updated Invoice234".
 * If so, it returns "Updated Invoice235".
 * 
 * If string contains no trailing number, the funciton will simply append '1'
 * to the end.
 * So if we call it with a string 'Invoice' consequently, passing its result back to
 * the function, we will get a sequence:
 * Invoice 	=> Invoice1
 * Invoice1	=> Invoice2
 * Invoice2	=> Invoice3
 * And so on.
 * 
 */
function IncrementInd(/**string*/str)
{
	var indStr = "";
	var indOffset = str.length;
	
	// Find trailing number.
	for(var i=str.length-1;i>=0;i=i-1)
	{
		var s = str.charAt(i);
		if( "0123456789".indexOf(s) >= 0)
		{
			// Prepend s before indStr
			indStr = s + indStr;
			indOffset = i;
		} else {
			break; // End the loop immediately - no more digits
		}
	}
	
	var nextNum = 1;
	var padding = indStr.length;
	
	if( indStr.length > 0)
	{
		// https://www.w3schools.com/jsref/jsref_parseint.asp
		var num = parseInt(indStr, 10);
		nextNum = num + 1;
	}
	
	// Cut trailing number - indOffset is the beginning of number.
	str = str.substr(0, indOffset);
	
	// If number had some leading zeroes (0005), keep them by feeling new number
	// with 0s until we get same number size
	var /**string*/nextNumStr = ""+nextNum;
	
	// While loop - repeat operation until condition becomes false
	// i.e. loop stops when 'nextNumStr' size exceeds or equals 'padding' value.
	while( nextNumStr.length < padding )
	{
		nextNumStr = "0" + nextNumStr;
	}
	
	// Now append new number
	str = str + nextNumStr;
	return str;
}