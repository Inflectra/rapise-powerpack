//Use 'Record/Learn' button to begin test recording

function Test(params)
{
	Navigator.Open("https://demo.guru99.com/test/drag_drop.html");
	DoDragDrop('From1', 'To1');
	Global.DoSleep(3000);

	RVL.DoPlayScript("Main.rvl.xlsx", Tester.GetParam("sheetName", "RVL"));
}

g_load_libraries=["Web"]

