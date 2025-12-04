
/**
 * @PageObject Sfdc object to perform common actions like launch, navigate module, etc.
 *
 * @Version 1.0.5
 */
SeSPageObject("Sfdc");

global.g_recordUrls = false;

/**
 * Launches Salesforce in a browser. SfdcUrl, UserName, Password must be set in Config.xlsx
 */
function Sfdc_Launch()
{
	var url = Global.GetProperty("SfdcUrl", "", "%WORKDIR%\\Shared\\Config.xlsx");
	var usr = Global.GetProperty("UserName", "", "%WORKDIR%\\Shared\\Config.xlsx");
	var pwd = Global.GetProperty("Password", "", "%WORKDIR%\\Shared\\Config.xlsx");
	
	LoginSfdc(url, usr, pwd);
	
	Global.DoSleep(5000);
}

/**
 * Opens application.
 * @param app Name of an application (e.g. Service, Marketing, Sales).
 */
function Sfdc_OpenApp(/**string*/ app)
{
	SeS("G_Waffle").DoClick(5,5);
	var xpath = "//a[@data-label='" + app + "']";
	var obj = Navigator.SeSFind(xpath);
	if (obj)	
	{
		obj.object_name = app;
		obj.DoLClick();
	}
	else
	{
		Tester.Assert("App element is not found: " + app, false);
	}
}

/**
 * Navigates to module using nav bar.
 * @param module Name of a module (e.g. Leads, Contacts, Opportunities).
 */
function Sfdc_NavigateModule(/**string*/ module)
{
	var xpath = "//one-app-nav-bar-item-root/a[@title='" + module + "']";
	var obj = Navigator.SeSFind(xpath);
	if (obj)	
	{
		obj.object_name = module;
		obj.DoLClick();
	}
	else
	{
		Tester.Assert("Module element is not found: " + module, false);
	}
}

/** 
 * Selects list view.
 * @param view Name of a view. E.g. Recently Viewed, All Open Leads
 */
function Sfdc_SelectListView(/**string*/ view)
{
	SeS("G_Select_List_View").DoClick();
	var xpath = "//a[@role='option' and contains(.,'" + view + "')]/span";
	var xpath = "//lightning-base-combobox-item//span[contains(.,'" + view + "')]";
	var obj = Navigator.SeSFind(xpath);
	if (obj)	
	{
		obj.object_name = view;
		obj._DoEnsureVisible();
		obj._DoMouseMove();

		// after mouse move we have new element
		obj = Navigator.SeSFind(xpath);
		obj.DoClick();
	}
	else
	{
		Tester.Assert("View element is not found: " + view, false);
	}
}

/**
 * Clicks button by name
 * @param name Name of a button
 */
function Sfdc_ClickButton(/**string*/ name)
{
	var xpath = "//div[@title='" + name + "']";
	var obj = Navigator.SeSFind(xpath);
	if (obj)
	{
		obj.object_name = name;
		obj.DoClick();
	}
	else
	{
		Tester.Assert("Button '" + name + "' is not found", false);
	}
}

/**
 * Sets text into a form field
 * @param name Name of a field
 * @param value Text to enter
 */
function Sfdc_SetTextField(/**string*/ name, /**string*/ value)
{
	var xpath = "//input[@name='" + name + "' or @placeholder='" + name + "']";
	var obj = Navigator.SeSFind(xpath);
	if (obj)
	{
		obj.object_name = name;
		obj.DoSetText(value);
	}
	else
	{
		Tester.Assert("Input field '" + name + "' is not found", false);
	}
}

/**


/**
 * Searches data in a table.
 */
function Sfdc_SearchTable(/**string*/ value)
{
	var xpath = "//input[@type='search' and @class='slds-input']";
	var obj = Navigator.SeSFind(xpath);
	if (obj)	
	{
		obj.object_name = "Search";
		obj.DoClick();
		obj.DoSetText(value);
		Global.DoSleep(500);
		WebDriver.Actions().SendKeys('\uE007').Perform();
		Global.DoSleep(2000);
	}
	else
	{
		Tester.Assert("Search element is not found", false);
	}
}

/** 
 * Selects item from a combobox
 * @param item Item name.
 * @param name Name of a combobox.
 */
function Sfdc_SelectComboboxItem(/**string*/ name, /**string*/ item)
{
	var xpath = "//lightning-combobox[.//label[text()='" + name + "']]";
	var obj = Navigator.SeSFind(xpath);
	if (obj)
	{
		obj.object_name = name;
		obj.DoEnsureVisible();
		
		var openButton = obj._DoDOMQueryXPath('.//button[@role="combobox"]');
		if (openButton && openButton.length)
		{
			openButton[0].DoLClick();
		}
		else
		{
			obj.DoClick(obj.GetWidth() - 20);
		}
		
		var itemObj = Navigator.SeSFind("//lightning-base-combobox-item[.//span[@title='" + item + "']]");
		if (itemObj)
		{
			itemObj.object_name = item;
			itemObj.DoClick();
		}
		else
		{
			Tester.Assert("Item element is not found: " + item, false);
		}
	}
	else
	{
		Tester.Assert("Combobox element is not found: " + name, false);
	}
}

/**
 * Saves DOM tree of the current page to dom.xml file.
 */
function Sfdc_SaveDom()
{
	var domTree = Navigator.GetDomTree(false);
	if (domTree)
	{
		var res = JSON.stringify(domTree, _underscore_stringify_replacer);
		File.Write('domR.json', res);
	
		Navigator.SaveDomToXml("dom.xml", domTree);
	}
	else
	{
		Tester.Message("Failed to get DOM tree");
	}
}

/**
 * Uploads a file.
 */
function UploadFile(/**string*/ path)
{
	var obj = Navigator.SeSFind("//input[@type='file']");
	if (obj)
	{
		Tester.Message("Uploading file: " + path);
		obj.DoSendKeys(path);
	}
}

/**
 * Writes key/value pair to Output.xlsx
 * @param key
 * @param value
 */
function SetOutputValue(/**string*/ key, /**string*/ value)
{
	Global.SetProperty(key, value, "%WORKDIR%\\Output.xlsx");
}

/**
 * Reads value from Output.xlsx
 * @param key
 * @param [defValue]
 */
function GetOutputValue(/**string*/ key, /**string*/ defValue)
{
	return Global.GetProperty(key, defValue, "%WORKDIR%\\Output.xlsx");
}

/**
 * Navigates to the specified URL and performs login.
 * Opens a browser if necessary.
 * @param url
 * @param userName
 * @param password
 */
function LoginSfdc(/**string*/ url, /**string*/ userName, /**string*/ password)
{
	var o = {
		"UserName": "//input[@id='username']",
		"Password": "//input[@id='password']",
		"Sumbit": "//input[@id='Login']"	
	};
	
	Tester.Message("Browser profile: " + g_browserProfile);

	Navigator.Open(url);
	Navigator.SetPosition(0, 0);
	Navigator.SetSize(1920, 1080);
	
	Tester.SuppressReport(true);

	try
	{
		Navigator.Find(o["UserName"]).DoSetText(userName);
		Navigator.Find(o["Password"]).DoSetText(password);
		Navigator.Find(o["Sumbit"]).DoClick();
		Global.DoSleep(2000);
		Tester.SuppressReport(false);
		Tester.Message("Logged in as " + userName);
	}
	catch(e)
	{
		Tester.SuppressReport(false);	
		Tester.Message(e.message);
	}	
}
