
/**
 * @PageObject ExtentReports description
 */
SeSPageObject("ExtentReports");

var _er = null;
var _test = null;

function ExtentReports_DoSayHello()
{
	ExtentReports.Init();
	ExtentReports.CreateTest(global.g_testAliasName);
	ExtentReports.Log('Pass', 'First step of the test');
	ExtentReports.Finish();
	return true;
}

function ExtentReports_Log(/**string*/ status, /**string*/ details)
{
	if (_test)
	{
		_test.Log(status, details);
	}
	return true;
}

function ExtentReports_LogScreenshot(/**string*/ base64, /**string*/ title)
{
	if (_test)
	{
		_test.LogScreenshot(base64, title);
	}
	return true;
}

function ExtentReports_CreateTest(/**string*/ name, /**string*/ description)
{
	if (_er)
	{
		description = description || "";
		_test = _er.CreateTest(name, description);
	}
	return _test;
}

function ExtentReports_Init()
{
	if (typeof(g_executionIndex) != "undefined")
	{
		Log("g_executionIndex: " + g_executionIndex);
		if (g_executionIndex == 0)
		{
			Log("Deleting ExtentReport history");
			ExtentReports.Clear();
		}
	}
	if (!_er)
	{
		_Register();
		_er = new ActiveXObject("ExtentReportsWrapper.ExtentReportsWrapper");
		var filePath = Global.GetFullPath("ExtentReport.html");
		_er.CreateSparkReporter(filePath);
	}
	return true;
}

function ExtentReports_Finish()
{
	if (_er)
	{
		_er.Flush();
		var filePath = Global.GetFullPath("ExtentReport.html");
		SeSRegisterIDETask("closereport", {});
		SeSRegisterIDETask("invokeaction", {id: "ReopenUrl", path: filePath});
	}
	return true;
}

function ExtentReports_Clear()
{
	_er = null;
	var htmlFilePath = Global.GetFullPath("ExtentReport.html");
	var jsonFilePath = Global.GetFullPath("ExtentReport.json");
	if (File.Exists(htmlFilePath))
	{
		File.Delete(htmlFilePath);
	}
	if (File.Exists(jsonFilePath))
	{
		File.Delete(jsonFilePath);
	}
}

function _Register()
{
	Global.DoCmd('"' + __dirname + "\\Bin\\register-wrapper.cmd" + '"', ".", true, false);
}

if (typeof(SeSOnReportMessage) == "undefined")
{
	SeSOnReportMessage = function () {};
}

SeSOnReportMessage(function(/**string*/ type, /**string*/ message, /**number*/ status, /**SeSReportLink|SeSReportText|SeSReportImage|Object[]*/ data, /**object*/ tags) {
	// return true - skip the message from being reported
	// return false / nothing - proceed with this message
	// Log("REPORT: " + type + ", " + message + ", " + status);
	
	if (g_scriptFileName.indexOf("FWUsefulPageObjects") != -1)
	{
		if (g_scriptFileName.indexOf("TestCases\\ExtentReports") == -1)
		{
			return false;
		}
	}
	
	if (type == "Test")
	{
		if (status == -2)
		{
			ExtentReports.Init();
			ExtentReports.CreateTest(global.g_testAliasName);
		}
		else
		{
			ExtentReports.Finish();
		}
	}
	else if (type == "Assert")
	{
		ExtentReports.Log(status ? "Pass" : "Fail", message);
	}
	else if (type == "Message")
	{
		if (status == -2 && data && data._imgWrapper)
		{
			ExtentReports.LogScreenshot(data._imgWrapper.ToBase64Bitmap(), message);
		}
		else if (status == -2)
		{
			ExtentReports.Log("Info", message);
		}
	}
	
	return false;
});