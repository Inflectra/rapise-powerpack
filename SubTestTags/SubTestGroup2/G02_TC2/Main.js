//Use 'Record/Learn' button to begin test recording

function Test(params)
{
	RVL.DoPlayScript("%WORKDIR%\\SubTestGroup2\\G02_TC2\\Main.rvl.xlsx", Tester.GetParam("sheetName", "RVL"));
}

