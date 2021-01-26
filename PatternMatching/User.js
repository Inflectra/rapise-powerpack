//Put your custom functions and variables in this file

var PMError = "";

/**
 * Compare `str` with `pattern`. Pattern may contain fields defined in the `defObj`.
 * `defObj` is a structure:
  {
    f: "<range of values>"
  }
  so each time 'f' is found in the pattern, it will be matched agains <range of values>.
  
  Example:
  
  MatchPattern('1-X', 'N-L', {N:"0123456789", L:"XYZ"});
  
  Will check that 1 is a number '-' is exactly '-' (because it it is not a defined field) and then make sure that X belongs to range X,Y or Z.
  
  Function returns true if `str` is matching `pattern`. Otherwise it return false and global variable PMResult contains detailed information about the difference.
 */
function MatchPattern(/**string*/str, /**string*/pattern, /**object*/defObj)
{
	defObj = defObj || {};
	PMError = "";
	
	if(!str) PMError+="'str' is empty<br/>";
	if(!pattern) PMError+="'pattern' is empty<br/>";
	
	// Make sure both are strings - so we may safely check .length etc.
	str=""+str;
	pattern = ""+pattern;
	
	if(str.length!=pattern.length) PMError+="'str' length ("+str.length+") differs from pattern length ("+pattern.length+")<br/>";
	
	for(var i=0;i<Math.min(str.length, pattern.length);i++)
	{
		var s = str.charAt(i);
		var p = pattern.charAt(i);
		
		var err = false;
		var expected = p;
		
		if(defObj[p])
		{
			// Range is defined for char p - check the range
			if(defObj[p].indexOf(s)<0)
			{
				// Found in range
				err = true;
				expected = p+":"+defObj[p];
			}
		} else if( p!=s ) {
				err = true;
		}
		
		if(err)
		{
			PMError += "Found '"+s+"' at pos: "+(i+1)+". Expected '"+expected+"'.<br/>";
			PMError += pattern+"<br/>";
			PMError += str+"<br/>";
			for(var k=0;k<i;k++) PMError+="_";
			PMError+="^";
			return false;
		}
	}
	
	return PMError=="";
}

/**
	Match pattern using 'MatchPattern' and do an assertion for the result. `msg` is an assertion message.
	When match is failed, detailed information about the difference is saved to the report.
 */
function MatchPatternAssert(/**string*/msg, /*string*/str, /**string*/pattern, /**object*/defObj)
{
	var res = MatchPattern(str, pattern, defObj);
	if(res)
	{
		Tester.Assert(msg+"\n", res, new SeSReportText("<font face='Courier'>"+pattern+"<br/>"+str+"</font>"));
	} else {
		Tester.Assert(msg+"\n", res, new SeSReportText("<font face='Courier'>"+PMError+"</font>"));
	}
	return res;
}

/**
	Match pattern using 'MatchPattern' using `defObj` made from extra parameters passed form RVL (https://rapisedoc.inflectra.com/RVL/Params/#extra-parameters) as field definitions.
 */
function RVLMatchPattern(/*string*/str, /**string*/pattern)
{
	var lastParams = RVL.LastParams;
	return MatchPattern(str, pattern, lastParams);
}

/**
	Match pattern using 'MatchPattern' using `defObj` made from extra parameters passed form RVL (https://rapisedoc.inflectra.com/RVL/Params/#extra-parameters) as field definitions and make an assertion based on the comparison result.
 */
function RVLAssertMatchPattern(/**string*/msg, /*string*/str, /**string*/pattern)
{
	var lastParams = RVL.LastParams;
	return MatchPatternAssert(lastParams.msg, lastParams.str, lastParams.pattern, lastParams);
}