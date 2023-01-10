//Put your custom functions and variables in this file

SeSOnTestReportReady(function(){
	Log("Test done with status: "+g_testPassed);
	Log("Report file: "+g_reportFileName);
	
	var htmlName = "Report.html";
	var ldr = new ActiveXObject("Rapise.LogLoader");
	ldr.LoadTrp(g_reportFileName);
	ldr.ExportAsHtml("Lib\\LibSendSummaryReport\\Templates\\TestOnlyTpl.tt", htmlName);
	var text = File.Read(htmlName);
	
	Spira_GenerateTestSummaryReport(htmlName, /** spira project id */8, /** incident id */ 1156);
});