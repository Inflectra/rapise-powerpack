//Put your custom functions and variables in this file

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