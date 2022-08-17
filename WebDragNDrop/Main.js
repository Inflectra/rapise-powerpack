//Use 'Record/Learn' button to begin test recording

function Test(params)
{
	Navigator.Open("https://demo.guru99.com/test/drag_drop.html");
	DoDragDrop('From1', 'To1');
	Global.DoSleep(1000);

	RVL.DoPlayScript("Main.rvl.xlsx", Tester.GetParam("sheetName", "RVL"));
	
	
	Navigator.Open("https://www.w3schools.com/html/html5_draganddrop.asp");
	
	if( Global.DoWaitFor("Accept_all_&_visit_the_site", 2000) )
	{
		SeS('Accept_all_&_visit_the_site').DoClick();
	}
	
	Global.DoSleep(1000);
	// Do Drag&Drop using native events (see 4th parameter to DoDragDrop)
	DoDragDrop('From', 'To', true, true);
	Global.DoSleep(1000);
	
	Navigator.Close();
}

g_load_libraries=["Web"]

