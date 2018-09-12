/**
 * Put me to .user.js file of a test and use in ManualSteps.rmt to call 
 * Automated steps defined in RVL sheet.
 */
function AUTO(/**string*/ sheetName)
{
	Tester.BeginTest(sheetName);
	RVL.DoPlaySheet(sheetName);
	return Tester.EndTest() == Tester.Pass;
}
