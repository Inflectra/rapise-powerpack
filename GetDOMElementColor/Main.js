//Use 'Record/Learn' button to begin test recording

function Test(params)
{
	// Element should be passed as 2nd parameter to Navigator.ExecJS
	var el = SeS('Library_Information_System');
	// The JS gets executed in the web page context. If you need to return something, you need to assign it to `execResult` variable:
	var bc = Navigator.ExecJS("execResult= window.getComputedStyle( el,null).getPropertyValue('background-color'); ", el);
	
	Tester.Message("Background Color: "+bc);

	// Now we will do the same in RVL
	RVL.DoPlayScript("Main.rvl.xlsx", Tester.GetParam("sheetName", "RVL"));
}

g_load_libraries=["%g_browserLibrary%"]

