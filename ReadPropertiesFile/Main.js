
//########## Script Steps ##############

function Test(params)
{
	// Convert file to JSON
	var json = PropertiesToJSON('input.properties', 'input.json');
	// Read property 'home.title'
	var title = Global.GetProperty("home.title", null, 'input.json');
	
	Tester.AssertEqual('Home title property', title, 'My Tile');
	
	RVL.DoPlayScript("Main.rvl.xlsx", "RVL");
}

