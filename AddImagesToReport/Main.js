//Use 'Record/Learn' button to begin test recording

function Test(params)
{
	AddImagesToReport('This image is from README', '%WORKDIR%\\img\\RVL.png')
	AddImagesToReport('Full path', [Global.GetFullPath('ears.jpg'), 'hedgehog.jpg'])


	RVL.DoPlayScript("Main.rvl.xlsx", Tester.GetParam("sheetName", "RVL"));
}

g_load_libraries=["%g_browserLibrary%"]

