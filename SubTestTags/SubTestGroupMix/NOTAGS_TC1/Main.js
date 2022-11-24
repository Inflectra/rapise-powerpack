//Use 'Record/Learn' button to begin test recording

function Test(params)
{
	RVL.DoPlayScript("%WORKDIR%\\SubTestGroupMix\\NOTAGS_TC1\\Main.rvl.xlsx", Tester.GetParam("sheetName", "RVL"));
}

