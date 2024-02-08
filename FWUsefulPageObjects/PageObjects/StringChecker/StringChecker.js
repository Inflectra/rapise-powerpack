
/**
 * @PageObject StringChecker helps comparing strings with regular patterns.
 */
SeSPageObject("StringChecker");


//Put your custom functions and variables in this file

var PMError = "";

/**
  Compare `str` with `pattern`. Pattern may contain fields defined in the `defObj`.
  `defObj` is a structure:
  
  {
    f: "<range of values>"
  }
  so each time 'f' is found in the pattern, it will be matched agains <range of values>.
  
  Example:
  
  StringChecker.CheckPattern('1-X', 'N-L', {N:"0123456789", L:"XYZ"});
  
  Will check that:
    - 1 is a number 
    - '-' is exactly '-' (because it it is not a defined field)
    - X belongs to range X,Y or Z.
  
  Function returns true if `str` matches the `pattern`. Otherwise it return false and global variable PMResult contains detailed information about the difference.
 */
function StringChecker_CheckPattern(/**string*/str, /**string*/pattern, /**object*/defObj)
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
		
		if(defObj[p]) {
			var exp = defObj[p];
			if(exp instanceof Array) {
				var q = "";
				SeSEachKey(exp,function(k,v){
					q+=v;
				});
				exp = q;
			}
			// Range is defined for char p - check the range
			if(exp.indexOf(s)<0)
			{
				// Found in range
				err = true;
				expected = p+":"+exp;
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
	
	this.PMError = PMError;

	return PMError=="";
}

/**
	Match pattern using 'StringChecker.CheckPattern' and do an assertion for the result. `message` is an assertion message.
	When match is failed, detailed information about the difference is saved to the report.
 */
function StringChecker_VerifyPattern(/**string*/message, /**string*/str, /**string*/pattern, /**object*/defObj)
{
	var res = StringChecker.CheckPattern(str, pattern, defObj);
	if(res)
	{
		Tester.Assert(message, res, new SeSReportText("<font face='Courier'>"+pattern+"<br/>"+str+"</font>"));
	} else {
		Tester.Assert(message, res, new SeSReportText("<font face='Courier'>"+PMError+"</font>"));
	}
	return res;
}

/**
	Match pattern using 'StringChecker.CheckPattern'. The function returns `true` if match is successfull.
	This version of function is dedicated to be used from RVL. Additional pattern fields may be passed as additional parameters (RVL array params).
 */
function StringChecker_CheckPatternRVL(/**string*/str, /**string*/pattern)
{
	return StringChecker_CheckPattern(str, pattern, RVL.LastParams);
}

/**
	Match pattern using 'StringChecker.CheckPattern' and do an assertion for the result. `message` is an assertion message.
	When match is failed, detailed information about the difference is saved to the report.
	This version of function is dedicated to be used from RVL. Additional pattern fields may be passed as additional parameters (RVL array params).
 */
function StringChecker_VerifyPatternRVL(/**string*/message, /**string*/str, /**string*/pattern)
{
	return StringChecker_VerifyPattern(message, str, pattern, RVL.LastParams);
}

/**
	Check if `str` matches given regular expression. Match means the 
	whole `str` is covered by regexp.
	If match is partial, it is assumed that there is no match. For example:
		ABC matches A.*
		but
		ABC does not match AB (because it is partial match, not covering trailing C)
	
		If you pass in the RegExp object as `regexstr`, then match will be done using RegExp.test function. I.e. it may be either partial or full match depending on use of ^ and $.

	Function returns true if `str` matches the `regexstr`. Otherwise it return `false`.
 */
function StringChecker_CheckRegex(/**string*/str, /**string|RegEx*/regexstr)
{
	if( regexstr instanceof RegExp ) {
		return regexstr.test(str);
	} else if( (""+regexstr).indexOf("regex:")==0 ) {
		return SeSCheckString(regexstr,str);
	} else {
		return SeSCheckString("regex:"+regexstr,str);
	}
}

/**
	Verify that `str` matches given regular expression `regexstr` using StringChecker.CheckRegex.

	When match is failed, detailed information about the difference is saved to the report.
	This version of function is dedicated to be used from RVL. Additional pattern fields may be passed as additional parameters (RVL array params).
 */
function StringChecker_VerifyRegex(/**string*/message, /**string*/str, /**string|RegEx*/regexstr)
{
	var success = StringChecker.CheckRegex(str,regexstr);
	Tester.Assert(message, success, [new SeSReportText("<font face='Courier'>"+regexstr+"<br/>"+str+"</font>")])
}

/**
 * Check that given `val` is unique. I.e. it differs from all known previous values.
 *
 * Function returns `true` if `val` is unique, `false` otherwise.
 */
function StringChecker_CheckUnique(/**string*/val)
{
	if( Global.GetProperty(""+val, "StringChecker.json") )
	{
		return false;
	} else {
		Global.SetProperty(""+val, true);
		return true;
	}
}

/**
 * Check that given `val` is unique. I.e. it differs from all known previous values.
 *
 * Function returns `true` if `val` is unique, `false` otherwise.
 */
function StringChecker_CheckUnique(/**string*/val)
{
	if( Global.GetProperty(""+val, false, "StringChecker.json") )
	{
		return false;
	} else {
		Global.SetProperty(""+val, true, "StringChecker.json");
		return true;
	}
}

/**
 * Verify that given `val` is unique. Write result to the report with provided `message`. 
 */
function StringChecker_VerifyUnique(/**string*/message, /**string*/val)
{
	Tester.Assert(message, StringChecker_CheckUnique(val), ""+val);
}


