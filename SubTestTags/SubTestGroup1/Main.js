//Use 'Record/Learn' button to begin test recording

function Test(params)
{
	RVL.DoPlayScript("%WORKDIR%\\SubTestGroup1\\Main.rvl.xlsx", Tester.GetParam("sheetName", "RVL"));
}

