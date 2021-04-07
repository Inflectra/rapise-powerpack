// Put library code here

if (typeof(g_spiraConfigPath) == "undefined")
{
	g_spiraConfigPath = "%WORKDIR%\\SpiraConfig.xlsx";
}

/**
 * Logs into Spira. The function reads URL and credentials from a file specified in `g_spiraConfigPath`.
 */
function SpiraLogin()
{
	var page = {
	  G_LoginButton: "//input[@name='mpLogin$cplMainContent$LoginUser$btnLogin' and @id='btnLogin']",
	  G_User_Name: "//input[@name='mpLogin$cplMainContent$LoginUser$UserName' and @id='UserName']",
	  G_Password: "//input[@name='mpLogin$cplMainContent$LoginUser$Password' and @id='Password']",
	  G_SignOffOthers: "//a[@id='cplMainContent_btnSignOffOthers' and text()='Sign Off The Other Locations']"
	};
	Tester.Message("Configuring...");
	var url = SpiraGetURL();
	var usr = SpiraGetUserName();
	var pwd = SpiraGetPassword();
	
	Tester.Message("Navigating...");
	Navigator.Open(url);
	Tester.Message("Repositioning...");
	Navigator.SetPosition(0, 0);
	Navigator.SetSize(1440, 900);

	Tester.Message("Getting Page...");
	var o_usr = Navigator.SeSFind(page.G_User_Name);
	o_usr.object_name = "UserName";
	var o_pwd = Navigator.SeSFind(page.G_Password);
	o_pwd.object_name = "Password";
	var o_login = Navigator.SeSFind(page.G_LoginButton);
	o_login.object_name = "Login";
	
	if (o_usr && o_pwd && o_login)
	{
		o_usr.DoClick();
		o_usr.DoSetText(usr);
		o_pwd._DoSetText(pwd);
		Global.DoSleep(g_commandInterval);
		o_login.DoClick();
		//Global.DoSleep(3000);
		var attempts = 20;
		Tester.Message("Waiting for 'My Page'...");
		while(!Navigator.DoWaitFor("//span[text()='My Page']", g_commandInterval) && attempts>0)
		{
			Log("Or for 'Sign Off The Other Locations'...");
			if (Navigator.DoWaitFor(page.G_SignOffOthers, g_commandInterval))
			{
				var o_signoff = Navigator.SeSFind(page.G_SignOffOthers);
				o_signoff.object_name = "SignOff";
				o_signoff.DoClick();
				break;
			}
			attempts--;
			Tester.Message("Still Waiting for 'My Page' ("+attempts+")");
		}
		
		//Navigator.DoWaitFor("//span[text()='My Page']");
	}
	else
	{
		Tester.Assert("Spira login failed", false);
	}
}

function SpiraLogout()
{
	var page = {
	  G_Logout: "//a[@id='globalNav_userDropdown_logout']",
	  G_Open_User_Menu: "//button[@id='globalNav_userDropdown']",
	  G_User_Name: "//input[@name='mpLogin$cplMainContent$LoginUser$UserName' and @id='UserName']"
	};

	var o_mnu = Navigator.SeSFind(page.G_Open_User_Menu);
	
	if( o_mnu )
	{
		o_mnu.DoClick();
		
		Global.DoSleep(500);
	
		var o_logout = Navigator.SeSFind(page.G_Logout);
		
		if(o_logout)
		{
			o_logout.DoClick();
			// After logout it should display the login screen.
			// So once we see a 'Username' field - we ar edone
			var success = Navigator.DoWaitFor(page.G_User_Name, 10000)
			Tester.Assert('Logout successfull', success);
			return success!=null;
		} else {
			Tester.Assert('Error in Spira.Logout: unable to locate logout', false);
		}
		
	} else {
		Tester.Assert('Error in Spira.Logout: unable to locate menu object', false);
	}
	return false;
	
}

/**
 * Builds for URL for a given page. The `page` is appended to the `SpiraURL`. 
 * Base Spira URL is either passed via the global variable `g_baseUrl` or read from Config.
 */
function SpiraGetURL(/**string*/ page)
{
	var baseURL = "";
	
	if (typeof(g_baseUrl) != "undefined")
	{
		baseURL = g_baseUrl;
	}
	else
	{
		baseURL = Global.GetProperty("SpiraURL", "", g_spiraConfigPath);
	}
	
	if (page)
	{
		return baseURL + "/" + page;
	}
	
	return baseURL;
}

function SpiraIsInVirtualDirectory()
{
	var baseURL = SpiraGetURL();
	if (baseURL.toLowerCase().indexOf("/spira") != -1)
	{
		return true;
	}
	return false;
}

function SpiraGetProjectURL (/**string*/ page) 
{
/* *** For SpiraPlan Only  ***
   The project URL scheme change for SpiraPlan, SpiraTeam, and SpiraTest. 
   For Spiraplan: https://doaminURL/SpiraProjectId/MyPage.aspx
   For SpiraTeam: http://doaminURL/Spira/1/MyPage.aspx
   So, use this method only to access for SpiraPlan only
*/
    var /**HTMLObject*/ topObj = Navigator.SeSFind("/html");
	var pageUrl = topObj.GetPageURL();
	var parts = pageUrl.split("/");
	try
	{ //The reason why I am doing this is because /spira is part of the domain in master.corp.com/spira but there is no /spira for other production instances like Champions
		if (SpiraIsInVirtualDirectory())
		{
			var projectId = parseInt(parts[4]); //We are using /spira
		}
		else
		{
			var projectId = parseInt(parts[3]); //We are using config.xlsx or ConfigDevEu.xlsx
		}
		//old code: var projectId = parseInt(parts[3]);
		if (projectId != NaN)
		{
			var url = SpiraGetURL(projectId + "/" + page + ".aspx");
			return url;
		}
	}
	catch(e)
	{
		Tester.Assert("Failed to parse project ID: " + pageUrl, false);
	}
	return null;
}

function SpiraTeamGetProjectURL (/**string*/ page) 
{
/* *** For SpiraTeam Only ***
   The project URL scheme change for SpiraPlan, SpiraTeam, and SpiraTest. 
   For Spiraplan: https://doaminURL/SpiraProjectId/MyPage.aspx
   For SpiraTeam: http://doaminURL/Spira/1/MyPage.aspx
   So, use this method only to access SpiraTeam only
*/
    var /**HTMLObject*/ topObj = Navigator.SeSFind("/html");
	var pageUrl = topObj.GetPageURL();
	var parts = pageUrl.split("/");
	try
	{
		var projectId = parseInt(parts[4]); //For SpiraTeam use 4
		if (projectId != NaN)
		{
			var url = SpiraGetURL(projectId + "/" + page + ".aspx");
			return url;
		}
	}
	catch(e)
	{
		Tester.Assert("Failed to parse project ID: " + pageUrl, false);
	}
	return null;
}


function SpiraGetProgramURL (/**string*/ page) 
{
    var /**HTMLObject*/ topObj = Navigator.SeSFind("/html");
	var pageUrl = topObj.GetPageURL();
	var parts = pageUrl.split("/");
	try
	{
		if (SpiraIsInVirtualDirectory())
		{
			var projectId = parseInt(parts[5]); //We are using /spira
		}
		else
		{
			var projectId = parseInt(parts[4]); ////We are using config.xlsx or ConfigDevEu.xlsx
		}
		// old code: var projectId = parseInt(parts[4]);
		if (projectId != NaN)
		{
			var url = SpiraGetURL("pg/" + projectId + "/" + page + ".aspx");
			return url;
		}
	}
	catch(e)
	{
		Tester.Assert("Failed to parse project ID: " + pageUrl, false);
	}
	return null;
}


function SpiraTeamGetProgramURL (/**string*/ page) 
{
    var /**HTMLObject*/ topObj = Navigator.SeSFind("/html");
	var pageUrl = topObj.GetPageURL();
	var parts = pageUrl.split("/");
	try
	{
		var projectId = parseInt(parts[5]);
		if (projectId != NaN)
		{
			var url = SpiraGetURL("pg/" + projectId + "/" + page + ".aspx");
			return url;
		}
	}
	catch(e)
	{
		Tester.Assert("Failed to parse project ID: " + pageUrl, false);
	}
	return null;
}

function SpiraGetPortfolioURL (/**string*/ page) 
{

    var /**HTMLObject*/ topObj = Navigator.SeSFind("/html");
	var pageUrl = topObj.GetPageURL();
	var parts = pageUrl.split("/");
	try
	{ 
		if (SpiraIsInVirtualDirectory())
		{
			var projectId = parseInt(parts[5]); //We are using /spira
		}
		else
		{
			var projectId = parseInt(parts[4]); ////We are using config.xlsx or ConfigDevEu.xlsx
		}
		//old code: var projectId = parseInt(parts[4]);
		if (projectId != NaN)
		{
			var url = SpiraGetURL("pf/" + projectId + ".aspx");
			return url;
		}
	}
	catch(e)
	{
		Tester.Assert("Failed to parse project ID: " + pageUrl, false);
	}
	return null;
}


function SpiraTeamGetPortfolioURL (/**string*/ page) 
{
/* Portfolio does not apply to SpiraTeam and SpiraTest. Since the background data exists, Simon said it should always be targeting the portfolio id = 1 (Core Services) 
 * The URL for this "Core Services" portfolio (portfolio id = 1) is http://master/Spira/pf/1.aspx
 */
	var url = SpiraGetURL("pf/" + page +".aspx");
	return url;
}

function SpiraGetEnterpriseURL (/**string*/ page)
{

/* Enterprise applies only to SpiraPlan. So, the equivalent functions for other Spira editions are not created */

	var url = SpiraGetURL("Enterprise/" + page + ".aspx");
	return url;
}



/**
 * Returns `true` if navigated to a given page successfully, otherwise - `false`.
 * @param url Location to navigate
 * @param [description] Optional description that will be printed to the report
 */
function SpiraNavigate(/**string*/ url, /**string*/ description, /**boolean*/ expectFailure)
{
	if (typeof(expectFailure) == "undefined")
	{
		expectFailure = false;
	}
	
	var result = false;
	
	Tester.Message("Navigating to", url);
	Navigator.Open(url);
	
	var /**HTMLObject*/ topObj = Navigator.SeSFind("/html");
	var pageUrl = topObj.GetPageURL();
	
	if (!pageUrl)
	{
		Tester.Message("PageUrl is empty, retry...");
		Global.DoSleep(5000);
		topObj = Navigator.SeSFind("/html");
		pageUrl = topObj.GetPageURL();
	}
	
	var lcPageUrl = ("" + pageUrl).toLowerCase();
	var lcUrl = ("" + url).toLowerCase();
	
	if (lcPageUrl == lcUrl)
	{
		if (!Navigator.CheckObjectExists("//h1[contains(text(), 'Server Error')]"))
		{
			result = true;
		}
		else
		{
			Tester.Assert("Bad navigation, server error", false);
			
		}
	}
	Tester.Message("Navigation landed on", pageUrl);
	
	/** 
	 * If a page (MyPage, Enterprise) that does not require project id or an artifact is unavailable
	 * for a specific Spira edition (Risk is uavailable in Team and Test, Task is unavailable only in Test),
	 * then, the page ends in MyPage. This is an expected behavior. However, this function flags it as a failure 
	 * but will assert with the param passed for success. So, I have added more checks when the pageUrl and 
	 * url are different, flag a new message in the function and return. 
	 */
	if (lcPageUrl != lcUrl)
	{//we don't want to check if MyPage was dispalyed when actually MyPage was accessed
		if (pageUrl.indexOf("MyPage") != -1)
		{ //When url was accessed, we landed on MyPage (pageURL) which means we don't have access to this page
			Tester.Assert("This page can't be accessed in this Spira Edition", expectFailure == true);
			
			// Let us get the specific alert text displayed
			var index = SpiraAlertCount();
			Tester.Assert(SpiraGetAlertText(index), true);
			Navigator.DoScreenshot();
			
			result = true;
			Global.DoSleep(1000);
			return result;
		}
	}
	
	if (expectFailure)
	{
		Tester.Assert("Access to this page should not be possible in this Spira Edition", false);	
	}
	
	if (!result)
	{
		Navigator.DoScreenshot();
	}

    if (description)
	{
		Tester.Assert(description, result)	
	}
	
	Global.DoSleep(1000);
	
	return result;
}

/**
 * Returns Spira login name. It is either passed via the global variable `g_login` or read from Config.
 * 
 */
function SpiraGetUserName()
{
	var login = "";
	if (typeof(g_login) != "undefined")
	{
		login = g_login;
	}
	else
	{
		login = Global.GetProperty("UserName", "", g_spiraConfigPath);
	}
	return login;
}

/**
 * Returns Spira password. It is either passed via the global variable `g_password` or read from Config.
 * 
 */
function SpiraGetPassword()
{
	var pwd = "";
	if (typeof(g_password) != "undefined")
	{
		pwd = g_password;
	}
	else
	{
		pwd = Global.GetProperty("Password", "", g_spiraConfigPath);
		pwd = Global.DoDecrypt(pwd);
	}
	return pwd;
}

/**
 * Navigates to an artifact for the current project. Suburl is the part of Artifcat url without .aspx suffix, e.g. Requirement/List.
 * Dropdowns.xlsx has the list of suburls, so you may select from it in RVL.
 */
function SpiraAccessArtifactUrl(/**string*/ suburl)
{
	var /**HTMLObject*/ topObj = Navigator.Find("/html");
	var pageUrl = topObj.GetPageURL();
	var parts = pageUrl.split("/");
	try
	{
	
		if (SpiraIsInVirtualDirectory())
		{
			var projectId = parseInt(parts[4]); //We are using /spira
		}
		else
		{
			var projectId = parseInt(parts[3]); ////We are using config.xlsx or ConfigDevEu.xlsx
		}
	// old code: var projectId = parseInt(parts[3]); 
		if (projectId != NaN)
		{
			var url = SpiraGetURL(projectId + "/" + suburl + ".aspx");
			Navigator.Open(url);
			return url;
		}
	}
	catch(e)
	{
		Tester.Assert("Failed to parse project ID: " + pageUrl, false);
	}
}

function SpiraTeamAccessArtifactUrl(/**string*/ suburl)
{
	var /**HTMLObject*/ topObj = Navigator.Find("/html");
	var pageUrl = topObj.GetPageURL();
	var parts = pageUrl.split("/");
	try
	{
		var projectId = parseInt(parts[4]);
		if (projectId != NaN)
		{
			var url = SpiraGetURL(projectId + "/" + suburl + ".aspx");
			Navigator.Open(url);
			return url;
		}
	}
	catch(e)
	{
		Tester.Assert("Failed to parse project ID: " + pageUrl, false);
	}
}

/**
 * Returns `true` if My Page is displayed, otherwise - `false`.
 */
function SpiraIsMyPageDisplayed()
{
	var /**HTMLObject*/ topObj = Navigator.SeSFind("/html");
	var pageUrl = topObj.GetPageURL();
	if (pageUrl.indexOf("MyPage") != -1)
	{
		return true;
	}
	return false;
}

function zArtifactExpandButton()
{
	var obj  = Navigator.SeSFind("//button[@id='globalNav_artifactDropdown' and @aria-label='Global Navigation Open Artifact Menu' and @type='button']");
	if (obj)
	{
		obj.object_name = "Artifacts"
	}
	return obj;
}

/**
 * Expands Artifact dropdown to check if menu item with the given name exists or not.
 * Returns `true` if the item is found, otherwise - `false`.
 */
function SpiraHasArtifact(/**string*/ artifact)
{
	zArtifactExpandButton()._DoClick();
	var result = Navigator.CheckObjectExists("//a[@aria-label='" + artifact + "']");
	zArtifactExpandButton()._DoClick();
	return result;
}

/**
 * Gets the number of items in the Artifacts menu.
 */
function SpiraGetArtifactCount()
{
	zArtifactExpandButton()._DoClick();
	var count = Navigator.DOMQueryValue("/html", "count(//a[contains(@class,'nav-drop-menu-item')])");
	zArtifactExpandButton()._DoClick();
	return count;
}

/**
 * Gets the name of a menu item with `index` in the Artifacts menu.
 * `index` is zero-based.
 */
function SpiraGetArtifactName(/**number*/ index)
{
	zArtifactExpandButton()._DoClick();
	var items = Navigator.DOMFindByXPath("//a[contains(@class,'nav-drop-menu-item')]", true);
	var result = null;
	if (index < items.length)
	{
		result = items[index].GetInnerText();
	}
	zArtifactExpandButton()._DoClick();
	return result;
}

/**
 * Opens an artifact using its name. The function expands the dropdown with all available artifacts and selects one specified in `artifact` parameter.
 */
function SpiraOpen(/**string*/ artifact)
{
	zArtifactExpandButton().DoClick();
	
	var obj = Navigator.SeSFind("//a[@aria-label='" + artifact + "']");
	if (obj)
	{
		obj.object_name = artifact;
		obj.DoClick();
	}
	else
	{
		Tester.Assert("Artifact not found: " + artifact, false);
	}
}

function zProjectExpandButton()
{
	var obj  = Navigator.SeSFind("//button[@id='globalNav_workspaceDropdown' and @aria-label='Global Navigation Open Workspace Menu' and @type='button']");
	if (obj)
	{
		obj.object_name = "Projects"
	}
	return obj;
}

/**
 * Expands Project dropdown to check if menu item with the given name exists or not.
 * Returns `true` if the item is found, otherwise - `false`.
 */
function SpiraHasProject(/**string*/ project)
{
	zProjectExpandButton()._DoClick();
	var result = Navigator.CheckObjectExists("//a[@aria-label and text()= '" + project + "']");
	zProjectExpandButton()._DoClick();
	return result;
}

/**
 * Gets the number of items in the Projects menu.
 */
function SpiraGetProjectCount()
{
	zProjectExpandButton()._DoClick();
	var count = Navigator.DOMQueryValue("/html", "count(//a[contains(@class,'nav-drop-menu-item')])");
	zProjectExpandButton()._DoClick();
	return count;
}

/**
 * Gets the name of a menu item with `index` in the Projects menu.
 * `index` is zero-based.
 */
function SpiraGetProjectName(/**number*/ index)
{
	zProjectExpandButton()._DoClick();
	var items = Navigator.DOMFindByXPath("//a[contains(@class,'nav-drop-menu-item')]", true);
	var result = null;
	if (index < items.length)
	{
		result = items[index].GetInnerText();
	}
	zProjectExpandButton()._DoClick();
	return result;
}

/**
 * Selects a project/product by name. The functions expands the dropdown with all available products and selects one specified in `project` parameter.
 */
function SpiraSelectProject(/**string*/ project)
{
	var ddObj = Navigator.DoWaitFor("//button[@id='globalNav_workspaceDropdown' and @aria-label='Global Navigation Open Workspace Menu' and @type='button']", 30000);
	if (ddObj)
	{
		Global.DoSleep(3000);
		ddObj.object_name = "WorkspaceDropdown";
		ddObj.DoClick();
		var pObj = Navigator.SeSFind("//a[contains(@aria-label, '" + project + "')]");
		if (pObj)
		{
			pObj.object_name = project;
			pObj.DoClick();
			
			var cpObj = Navigator.SeSFind("//button[@id='globalNav_workspaceDropdown']/span/span[2]/span");
			Tester.AssertEqual("Project selected", cpObj.GetInnerText(), project);
			
			return;
		}
	}
	
	/**
	 * This function is used to select "Enterprise". It works in SpiraPlan but in SpiraTeam, there is no Enterprise. 
	 * Yet, we can use the same function to access the Enterprise avaiability because the Enterprise doesn't have a 
	 * projectid as part of the URL scheme. But, when using this function, if the project selected is Enterprise, then, we 
	 * shouldn't assert a failure. So, I have added a check towards the end for project not equal to Enterprise.
	*/
	if (project != "Enterprise") //Adding the check to avoid a failure if forcibly Enterprise is selected
	  Tester.Assert("Select project: " + project, false);
}

/**
 * Clicks on a toolbar button. The function uses button caption to find the button. 
 */
function SpiraClick(/**string*/ button)
{
	var obj = Navigator.SeSFind("//button[.//span/text()='" + button + "']");
	if (obj)
	{
		obj.object_name = button;
		obj.DoClick();
	}
	else
	{
		Tester.Assert("Button not found: " + button, false);
	}
}

/**
 * Selects a tab in the artifact details. E.g. Oberview, Tasks, Attachments.
 */
function SpiraSelectTab(/**string*/ tab)
{
	var xpath = "//span[contains(@class,'tab-caption') and text()='" + tab + "']";
	var obj = Navigator.SeSFind(xpath);
	if (obj)
	{
		if (Navigator.CheckObjectVisible(xpath))
		{
			obj.object_name = tab;
			obj.DoClick();
		}
		else
		{
			Tester.Assert("Tab is not visible: " + tab, false);
		}
	}
	else
	{
		Tester.Assert("Tab not found: " + tab, false);
	}	
}

/**
 * Selects a view to display artifact records (Tree, List, Board, Document, Mind Map).
 */
function SpiraSelectView(/**string*/ name)
{
	var xpath = "//a[@title='" + name + "']";
	var obj = Navigator.SeSFind(xpath);
	if (obj)
	{
		obj.object_name = name;
		obj.DoClick();
	}
	else
	{
		Tester.Assert("View button not found: " + name, false);
	}		
}

/**
 * Checks if an object is present on a page and visible. If it is not the case the function reports an error.
 */
function SpiraVerifyObject(/**string|objectId*/ xpathOrObjId)
{
	var res = Navigator.CheckObjectVisible(xpathOrObjId);
	Tester.Assert("Object visible: " + xpathOrObjId, res);
}

/**
 * Checks if a button is present on a page and visible. If it is not the case the function reports an error.
 */
function SpiraVerifyButton(/**string*/ caption, /**string*/ tab)
{
	var xpath = "//a[contains(.,'" + caption + "') and contains(@class, 'btn') and contains(@id, '" + tab + "')]";
	var res = Navigator.CheckObjectVisible(xpath);
	Tester.Assert("Button visible: '" + caption + "' in '" + tab + "'", res);
}

/**
 * Checks if a button is present in the main toolbar. If it is not the case the function reports an error.
 */
function SpiraVerifyMainButton(/**string*/ caption)
{
	var xpath = "//button[.//span/text()='" + caption + "']";
	var res = Navigator.CheckObjectExists(xpath);
	Tester.Assert("Button visible: '" + caption + "'", res);
}


/**
 * Returns `true` if a button is present in the main toolbar, otherwise - `false`.
 */
function SpiraHasMainButton(/**string*/ caption)
{
	var xpath = "//button[.//span/text()='" + caption + "']";
	var res = Navigator.CheckObjectExists(xpath);
	return res;
}


/**
 * Returns `true` if the tab is present, otherwise - `false`. Examples of tab names: Oberview, Tasks, Attachments.
 */
function SpiraArtifactHasTab(/**string*/ tab)
{
	var xpath = "//span[contains(@class,'tab-caption') and text()='" + tab + "']";
	var res = Navigator.CheckObjectVisible(xpath);
	return res;
}

/**
 * Expands a combobox on a form and selects an item in it. You need to learn the combobox before using this function.
 */
function SpiraComboSelect(/**objectId*/ combo, /**string*/ item)
{
	SeS(combo).DoClick();
	var obj = Navigator.SeSFind("//div[@role='option' and @title='" + item + "']");
	if (obj)
	{
		obj.object_name = item;
		obj.DoClick();
	}
	else
	{
		Tester.Assert("Item not found: " + item, false);
	}
}

/**
 * Sets value into an input field in the new record line. The function locates the input control using a column name.
 */
function SpiraTableSetValue(/**string*/ column, /**string*/ value)
{
	var cell = zSpiraTableGetInputCell(column);
	if (cell)
	{
		cell._DoClick();
		Global.DoSleep(g_commandInterval);
		cell._DoSetText(value);
		Global.DoSleep(g_commandInterval);
	}
	Tester.Assert("Set value '" + value + "' in column '" + column + "'", cell != null);
}

/**
 * Selects an item in the dropdown of a cell of the new record line. The function locates the cell using a column name.
 */
function SpiraTableSelectValue(/**string*/ column, /**string*/ value)
{
	var cell = zSpiraTableGetInputCell(column);
	if (cell)
	{
		cell.DoClick();
		Global.DoSleep(g_commandInterval);
		var obj = Navigator.Find("//div[@role='option' and @title='" + value + "']");
		if (obj)
		{
			obj.object_name = value;
			obj.DoClick();
		}
		else
		{
			Tester.Assert("Item not found: " + value, false);
		}
	}
	Tester.Assert("Select value '" + value + "' in column '" + column + "'", cell != null);
}

/**
 * Gets the value of a cell at [row, column]. You may specify column using name or index. Specify row using its index or cell value.
 * Indexes are zero-based.
 */
function SpiraTableGetCell(/**string|number*/ column, /**number|string*/ row)
{
	var cell = zSpiraTableGetCell(column, row);
	if (cell)
	{
		var value = cell._DoDOMQueryValue(".//text()").additional_value;
		if (value)
		{
			var parts = value.split(";");
			value = parts[parts.length - 1];
		}
		return value;	
	}
	return null;
}

/**
 * Click on a table cell. The cell is specified by [row, column] pair. See `SpiraTableGetCell` for details.
 */
function SpiraTableClickCell(/**string|number*/ column, /**number|string*/ row)
{
	var cell = zSpiraTableGetCell(column, row);
	if (cell)
	{
		cell.highlight();
		cell.DoLClick();
	}
	Tester.Assert("Click cell in row '" + row + "' and column '" + column + "'", cell != null);
}

/**
 * Clicks a button in the Operations column. The row is determined by [row, column] pair. Typical usage is to find a record with 
 * a given cell value in a specific column. Then click a button for this row.
 */
function SpiraTableClickButton(/**string|number*/ column, /**number|string*/ row, /**string*/ button)
{
	var cell = zSpiraTableGetCell(column, row);
	if (cell)
	{
		var btns = cell._DoDOMQueryXPath("..//a[contains(@href, '" + button.toLowerCase() + "') or contains(@href, '" + button + "') or contains(., '" + button + "')]");
		
		if (!btns.length)
		{
			btns = cell._DoDOMQueryXPath("..//button[text()='" + button + "']");
			if (!btns.length)
			{
				btns = cell._DoDOMQueryXPath("..//div[text()='" + button + "']");
			}
		}
		
		if (btns && btns.length)
		{
			var btn = btns[0];
			btn.object_name = button;
			btn.highlight();
			btn.DoClick();
		}
		else
		{
			// button not found
			Tester.Message("Button '" + button + "' not found in row '" + row + "' and column '" + column + "'");
			cell = null;
		}
	}

	Tester.Assert("Click button '" + button + "' in row '" + row + "' and column '" + column + "'", cell != null);
}

/**
 * Finds a row given a cell value in a specific column and then selects it by clicking the checkbox in the first column.
 */
function SpiraTableSelectRow(/**string|number*/ column, /**string*/ row)
{
	var cell = zSpiraTableGetCell(column, row);
	if (cell)
	{
		var rowIndex = cell.doQuery("count(../preceding-sibling::tr)", 0, true)
		if (rowIndex && rowIndex.length)
		{
			SpiraTableClickCell(1, rowIndex[0] + 1);
		}
	}

	Tester.Assert("Select row with value '" + row + "' in column '" + column + "'", cell != null);
}

/**
 * Waits for the main table on the page to load. Use before interacting with the table elements.
 */
function SpiraWaitForTable()
{
	var res = Navigator.DoWaitFor("//table[contains(@class,'DataGrid')]");
	Tester.Assert("Table loaded", res);
	Global.DoSleep(1000);
}

function zSpiraGetMainTable()
{
	var table = Navigator.SeSFind("//table[contains(@class,'DataGrid')]");
	if (table)
	{
		table.object_name = "Table";
	}
	return table;
}

function zSpiraGetColumnId(table, column)
{
	var cellTag = null;
	var columnElement = table._DoDOMQueryXPath(".//th[contains(.//text(),'" + column + "')]");
	if (columnElement && columnElement.length == 1)
	{
		cellTag = "th";
	}
	else
	{
		columnElement = table._DoDOMQueryXPath(".//td[contains(.//text(),'" + column + "')]");
		if (columnElement && columnElement.length == 1)
		{
			cellTag = "td";
		}
	}
	
	var columnId = null;
	if (cellTag)
	{
		var res = table._DoDOMQueryValue("count(.//" + cellTag + "[contains(.//text(),'" + column + "')]/preceding-sibling::*)");
		columnId = res.additional_value;	
	}
	
	if (columnId == null)
	{
		Tester.Assert("Column not found: " + column, false);
		return null;
	}
	
	columnId = parseInt(columnId) + 1;	
	return columnId;
}


function zSpiraTableGetCell(/**string|number*/ column, /**number|string*/ row)
{
	var table = zSpiraGetMainTable();
	if (table)
	{
		var columnId = column;
		if (typeof(column) == "string")
		{
			columnId = zSpiraGetColumnId(table, column);
			if (columnId == null)
			{
				return;
			}
		}
		
		var cells = null;
		
		if (typeof(row) == "string")
		{
			cells = table._DoDOMQueryXPath("./tbody//td[" + columnId + "][.//*/text()='" + row + "']");
			if (!cells || cells.length == 0)
			{
				cells = table._DoDOMQueryXPath("./tbody//td[" + columnId + "][normalize-space(.)='" + row + "']");
			}
		}
		else
		{
			row = row || "last()-1";
			cells = table._DoDOMQueryXPath("./tbody/tr[" + row + "]/td[" + columnId + "]");
		}
		
		if (cells && cells.length)
		{
			var cell = cells[0];
			cell.object_name = column;
			return cell;
		}
	}
	return null;
}

function zSpiraTableGetInputCell(/**string*/ column)
{
	//table[contains(@class,'DataGrid')]
	//table[contains(@class,'DataGrid')]//th[.//text()='Name']
	//table[contains(@class,'DataGrid')]//td[3]//input[not(contains(@name,'filter'))]
	
	var table = zSpiraGetMainTable();
	if (table)
	{
		var columnId = zSpiraGetColumnId(table, column);
		if (columnId == null)
		{
			return;
		}
		
		var cells = table._DoDOMQueryXPath(".//td[" + columnId + "]//input[not(contains(@name,'filter')) and not(contains(@id,'filter'))]");
		if (cells && cells.length)
		{
			var cell = cells[0];
			cell.object_name = column;
			return cell;
		}
		else
		{
			Tester.Assert("Input field not found for: " + column, false);
		}
	}
	else
	{
		Tester.Assert("Table not found", false);
	}
	return null;
}

/**
 * Sets text into a rich editor.
 */
function SpiraSetRichText(/**objectId*/ editor, /**string*/ text)
{
	if (g_browserLibrary.indexOf("Firefox") == 0)
	{
		var obj = SeS(editor, {xpath: "//iframe"});
		obj.DoLClick();
		Global.DoSendKeys(text);
	}
	else
	{
		var obj = SeS(editor);
		Navigator.ExecJS('arguments[0].innerHTML = "' + text + '"', obj);
	}
}

/**
 * Returns `true` if the page displays alerts.
 */
function SpiraHasAlerts()
{
	return SpiraAlertCount() > 0;
}

/**
 * Returns number of displayed alerts.
 */
function SpiraAlertCount()
{
	var xpath = "//span[@id='cplMainContent_lblMessage_text']";
	var obj = Navigator.DoWaitFor(xpath, 1000);
	if (obj)
	{
		var cc = obj._DoDOMQueryValue("count(.//span)");
		return cc.additional_value;
	}
	return 0;
}

/**
 * Returns text of an alert with index.
 */
function SpiraGetAlertText(/**number*/ index)
{
	var xpath = "//span[@id='cplMainContent_lblMessage_text']";
	var obj = Navigator.DoWaitFor(xpath, 1000);
	if (obj)
	{
		var text = obj._DoDOMQueryValue(".//text()").additional_value;
		if (text)
		{
			var alerts = text.split(";");
			if (index < alerts.length)
			{
				return Global.DoTrim(alerts[index]);
			}
		}
	}
	return "";
}

// Spira Test Framework



function Spira_Login(/**string*/url, /**string*/user, /**string*/password)
{
	if(url&&user&&password)
	{
		Global.SetProperty("SpiraURL", url, g_spiraConfigPath)
		Global.SetProperty("UserName", user, g_spiraConfigPath)
		Global.SetProperty("Password", Global.DoEncrypt(password), g_spiraConfigPath)
	}

	return SpiraLogin();
}

_paramInfoSpira_Login = {
    _description: "Logs into the application",
    _type: "boolean",
    _returns: "`true` if login is ok",
    url:
    {
        description: "Name of the user",
        type: "string",
        optional:true
    },
    user:
    {
        description: "User name",
        type: "string",
        optional:true
    },
    password:
    {
        description: "Password or API key of the user",
        type: "string",
        optional:true
    }
}

function Spira_Logout()
{
	return SpiraLogout();
}

function Spira_GetURL(/**string*/ page)
{
	return SpiraGetURL(page);
}

function Spira_GetProjectURL(/**string*/ page) 
{
	return SpiraGetProjectURL(page);
}

function Spira_Navigate(/**string*/ url)
{
	return SpiraNavigate(url);
}

function Spira_GetUserName()
{
	return SpiraGetUserName();
}

function Spira_GetPassword()
{
	return SpiraGetPassword();
}

function Spira_AccessArtifactUrl(/**string*/ suburl)
{
	return SpiraAccessArtifactUrl(suburl);
}

function Spira_IsMyPageDisplayed()
{
	return SpiraIsMyPageDisplayed();
}

function Spira_HasArtifact(/**string*/ artifact)
{
	return SpiraHasArtifact(artifact);
}

function Spira_GetArtifactCount()
{
	return SpiraGetArtifactCount();
}

function Spira_GetArtifactName(/**number*/ index)
{
	return SpiraGetArtifactName(index);
}

function Spira_Open(/**string*/ artifact)
{
	return SpiraOpen(artifact);
}

function Spira_HasProject(/**string*/ project)
{
	return SpiraHasProject(project);
}

function Spira_GetProjectCount()
{
	return SpiraGetProjectCount();
}

function Spira_GetProjectName(/**number*/ index)
{
	return SpiraGetProjectName(index);
}

function Spira_SelectProject(/**string*/ project)
{
	return SpiraSelectProject(project);
}

function Spira_Click(/**string*/ button)
{
	return SpiraClick(button);
}

function Spira_SelectTab(/**string*/ tab)
{
	return SpiraSelectTab(tab);
}

function Spira_SelectView(/**string*/ name)
{
	return SpiraSelectView(name);
}

function Spira_VerifyObject(/**string|objectId*/ xpathOrObjId)
{
	return SpiraVerifyObject(xpathOrObjId);
}

function Spira_VerifyButton(/**string*/ caption, /**string*/ tab)
{
	return SpiraVerifyButton(caption, tab);
}

function Spira_VerifyMainButton(/**string*/ caption)
{
	return SpiraVerifyMainButton(caption);
}

function Spira_HasMainButton(/**string*/ caption)
{
	return SpiraHasMainButton(caption);
}

function Spira_ArtifactHasTab(/**string*/ tab)
{
	return SpiraArtifactHasTab(tab);
}

function Spira_ComboSelect(/**objectId*/ combo, /**string*/ item)
{
	return SpiraComboSelect(combo, item);
}

function Spira_SetRichText(/**objectId*/ editor, /**string*/ text)
{
	return SpiraSetRichText(editor, text);
}

function Spira_HasAlerts()
{
	return SpiraHasAlerts();
}

function Spira_AlertCount()
{
	return SpiraAlertCount();
}

function Spira_GetAlertText(/**number*/ index)
{
	return SpiraGetAlertText(index);
}

function Spira_WaitForTable()
{
	return SpiraWaitForTable();
}

// Table
function SpiraTable_SetValue(/**string*/ column, /**string*/ value)
{
	return SpiraTableSetValue(column, value);
}

function SpiraTable_SelectValue(/**string*/ column, /**string*/ value)
{
	return SpiraTableSelectValue(column, value);
}

function SpiraTable_GetCell(/**string|number*/ column, /**number|string*/ row)
{
	return SpiraTableGetCell(column, row);
}

function SpiraTable_ClickCell(/**string|number*/ column, /**number|string*/ row)
{
	return SpiraTableClickCell(column, row);
}

function SpiraTable_ClickButton(/**string|number*/ column, /**number|string*/ row, /**string*/ button)
{
	return SpiraTableClickButton(column, row, button);
}

function SpiraTable_SelectRow(/**string|number*/ column, /**string*/ row)
{
	return SpiraTableSelectRow(column, row);
}

if (typeof(SeSGlobalObject) != "undefined")
{
	SeSGlobalObject("Spira");
	SeSGlobalObject("SpiraTable");
}
