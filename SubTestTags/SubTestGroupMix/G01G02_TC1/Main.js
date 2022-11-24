//Use 'Record/Learn' button to begin test recording

function Test(params)
{
	RVL.DoPlayScript("%WORKDIR%\\SubTestGroupMix\\G01G02_TC1\\Main.rvl.xlsx", Tester.GetParam("sheetName", "RVL"));
}

