//Use 'Record/Learn' button to begin test recording

function Test(params)
{
	Navigator.Open("https://libraryinformationsystem.org/");

	var styleObj = GetComputedStyle("Home");
	Tester.Message("Full Style from from JS",JSON.stringify(styleObj));
	
	var styleValue = GetComputedStyle("Home", "textAlign");
	Tester.Message("textAlign property from JS: ",JSON.stringify(styleValue));

	var styleValue = GetComputedStyle("//a[@href='Default.aspx']", "textAnchor");
	Tester.Message("textAnchor property from JS (and element XPath)",JSON.stringify(styleValue));

	// Now the same in RVL
	RVL.DoPlayScript("Main.rvl.xlsx", Tester.GetParam("sheetName", "RVL"));
}

g_load_libraries=["Web Service", "Web"]

