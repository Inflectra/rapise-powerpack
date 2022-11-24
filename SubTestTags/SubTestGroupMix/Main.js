//Use 'Record/Learn' button to begin test recording

function Test(params)
{
	RVL.DoPlayScript("%WORKDIR%\\SubTestGroupMix\\Main.rvl.xlsx", Tester.GetParam("sheetName", "RVL"));
}

