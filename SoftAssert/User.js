// Copy following code into your User.js or other .js file in your test.


/**
 * When an assertion fails, don't stop execution but record the failure. Calling Tester_AssertHasFailures() will execution stop if at least one assertion failed.
 */
function Tester_SoftAssert(/**string*/ message, /**boolean*/ condition, /**SeSReportLink|SeSReportText|SeSReportImage|object[]|string*/ data, /**object*/ tags)
{
	var stopOnError = g_stopOnError;
	g_stopOnError = false;
	
	Tester.Assert(message, condition, data, tags)
	
	g_stopOnError = stopOnError;
}

function Tester_AssertHasFailures(/**string*/message)
{
	Tester.Assert(message, Tester.GetTestStatus()==Tester.Pass);
}

Tester.SoftAssert = Tester_SoftAssert;
Tester.AssertHasFailures = Tester_AssertHasFailures;