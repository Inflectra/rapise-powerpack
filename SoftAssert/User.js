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

function Tester_SoftAssertEqual(/**string*/ message, /**object*/ obj1, /**object*/ obj2, /**SeSReportLink|SeSReportText|SeSReportImage|Object[]*/ data, /**object*/ tags)
{
	var stopOnError = g_stopOnError;
	g_stopOnError = false;
	
	Tester.AssertEqual(message, obj1, obj2, data, tags)
	
	g_stopOnError = stopOnError;
}

function Tester_SoftAssertContains(/**string*/ message, /**string*/text, /**string*/substr, /**SeSReportLink|SeSReportText|SeSReportImage|object[]|string*/ data, /**object*/ tags)
{
	var stopOnError = g_stopOnError;
	g_stopOnError = false;
	
	var condition = (""+text).indexOf(""+substr)>=0;
	
	if(!condition)
	{
		if(typeof(data)=="string")
		{
			var dataStr = data;
			data=[new SeSReportText(dataStr)];
		}
		
		if(!data)
		{
			data = [];
		}
		data.push(new SeSReportText("Substring:"));
		data.push(new SeSReportText(""+substr));
		data.push(new SeSReportText("Not found in:"));
		data.push(new SeSReportText(""+text));
	}
	
	Tester.Assert(message, condition, data, tags)
	
	g_stopOnError = stopOnError;
}

function Tester_SoftAssertNotContains(/**string*/ message, /**string*/text, /**string*/substr, /**SeSReportLink|SeSReportText|SeSReportImage|object[]|string*/ data, /**object*/ tags)
{
	var stopOnError = g_stopOnError;
	g_stopOnError = false;
	
	var condition = (""+text).indexOf(""+substr)<0;
	
	if(!condition)
	{
		if(typeof(data)=="string")
		{
			var dataStr = data;
			data=[new SeSReportText(dataStr)];
		}
		
		if(!data)
		{
			data = [];
		}
		data.push(new SeSReportText("Substring:"));
		data.push(new SeSReportText(""+substr));
		data.push(new SeSReportText("Should not be in:"));
		data.push(new SeSReportText(""+text));
	}
	
	Tester.Assert(message, condition, data, tags)
	
	g_stopOnError = stopOnError;
}

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


function Tester_SoftAssertAll(/**string*/message)
{
	Tester.Assert(message, Tester.GetTestStatus()==Tester.Pass);
}

Tester.SoftAssert = Tester_SoftAssert;
Tester.SoftAssertContains = Tester_SoftAssertContains;
Tester.SoftAssertNotContains = Tester_SoftAssertNotContains;
Tester.SoftAssertEqual = Tester_SoftAssertEqual;


Tester.SoftAssertAll = Tester_SoftAssertAll;
