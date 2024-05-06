// Put functions and global variables shared across all test cases here

/**
 * Run this code before each test case.
 */
SeSOnTestInit(function() {
	if (g_entryPointName == "Test") {
		// Put your common initialization code here
	}
});

/**
 * Run this code after each test case.
 */
SeSOnTestFinish(function() {
	if (g_entryPointName == "Test") {
		// Put your common finalization code here
	}
});


File.Delete("MyReport.txt");

// https://rapisedoc.inflectra.com/Guide/understanding_the_script/#sesonreportmessage
SeSOnReportMessage(
function(/**string*/ type, /**string*/ message, /**number*/ status, /**SeSReportLink|SeSReportText|SeSReportImage|Object[]*/ data, /**object*/ tags) {
	// Remember, don't write report here - it will call this function again and you need to know how to bypass it!
	if( type == "Assert") {
		if( status == Tester.Fail ) {
			File.Append("MyReport.txt", "Failed: "+message+"\n");
			// Data contains the position

			var currPos = null;
			if(typeof(RVL)!="undefined" && RVL._current_rvl_execution_stack && RVL._current_rvl_execution_stack.CurrentItem)
			{
				currPos = [RVL._current_rvl_execution_stack.CurrPosLink()];
				
				// If current JS statement is still here after filtering it is worth to display it.
				var jsPos = SeSGetCurrentStatementReportData();
				if(jsPos)
				{
					currPos = jsPos.concat(currPos);
				}
				
			} else {
				currPos = SeSGetCurrentStatementReportData();
			}
			if(currPos) 
			{
				File.Append("MyReport.txt", "At: "+currPos[currPos.length-1]._text+"\n");
			}

		} else if( status == Tester.Pass ) {
			File.Append("MyReport.txt", "Passed: "+message+"\n");
		}
	} else {
		// Other types are "Info" and "Test"
	}

// return true - skip the message from being reported
// return false / nothing - proceed with this message


});