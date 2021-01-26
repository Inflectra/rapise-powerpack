//Use 'Record/Learn' button to begin test recording

function Test(params)
{

	Tester.IgnoreStatus(true);
	MatchPatternAssert("Pattern Match", "ABC-123", "LLL-NNN", {"L":"ABCDEFG", "N": "0123456789"});
	MatchPatternAssert("Pattern Match", "ABC123", "LLL-NNN", {"L":"ABCDEFG", "N": "0123456789"});
	MatchPatternAssert("Pattern Match", "ABQ-123", "LLL-NNN", {"L":"ABCDEFG", "N": "0123456789"});

	MatchPatternAssert("Pattern Match", "ABCE-123", "LLL-NNN", {"L":"ABCDEFG", "N": "0123456789"});
	MatchPatternAssert("Pattern Match", "AB-123", "LLL-NNN", {"L":"ABCDEFG", "N": "0123456789"});
	MatchPatternAssert("Pattern Match", "AAA-x23", "LLL-NNN", {"L":"ABCDEFG", "N": "0123456789"});


	RVL.DoPlayScript("Main.rvl.xlsx", Tester.GetParam("sheetName", "RVL"));

	Tester.IgnoreStatus(false);
}

