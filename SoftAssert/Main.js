//Use 'Record/Learn' button to begin test recording

function Test(params)
{

	RVL.DoPlayScript("Main.rvl.xlsx", Tester.GetParam("sheetName", "RVL"));

	Tester.Assert('Pass0', true);
	Tester.SoftAssert('SoftFailure1', false);
	Tester.SoftAssert('SoftFailure2', true);

	Tester.Assert('Pass1', true);
	
	// How we should fail if there were failures
	Tester.AssertHasFailures('Aftermath', true);


}

