
/**
 * @PageObject Sfdc object to perform common actions like launch, navigate module, etc.
 *
 * @Version 2.0.1
 */
SeSPageObject("Sfdc");

global.g_recordUrls = false;

/**
 * Retries a callback until it returns a truthy result or attempts are exhausted.
 * @param {function} fn - Called each attempt. Should return a truthy value on success, falsy to retry.
 * @returns The last value returned by fn.
 */
function SfdcAutoWait(fn)
{
	var result = null;
	for (var attempt = 0; attempt < global.g_autoWaitAttempts; attempt++)
	{
		result = fn();
		if (result)
		{
			break;
		}
		if (attempt < global.g_autoWaitAttempts - 1)
		{
			SeSSleep(global.g_autoWaitAttemptInterval);
		}
	}
	return result;
}

function Sfdc_Launch()
{
	var url = Global.GetEnv('SF_URL');
	var usr = Global.GetEnv('SF_USERNAME');
	var pwd = Global.GetEnv('SF_PASSWORD');

	if (!url)
	{
		url = Tester.GetParam("SfdcUrl");
		usr = Tester.GetParam("SfdcUserName");
		pwd = Tester.GetParam("SfdcPassword");
	}
	
	if (!url || !usr || !pwd)
	{
		url = Global.GetProperty("SfdcUrl", "", "%WORKDIR%\\Shared\\Config.xlsx");
		usr = Global.GetProperty("SfdcUserName", "", "%WORKDIR%\\Shared\\Config.xlsx");
		pwd = Global.GetProperty("SfdcPassword", "", "%WORKDIR%\\Shared\\Config.xlsx");
	}
	
	if (!url)
	{
		url = SeSRequestString(
			"Salesforce URL",
			"Enter Salesforce login URL",
			"https://login.salesforce.com"
		);
		if (!url)
		{
			Tester.Message("Salesforce URL is not set. Do it via Parameters tab in the Spira Dashboard.");
			return false;
		}
		else
		{
			Global.SetProperty("SfdcUrl", url, "%WORKDIR%\\Shared\\Config.xlsx");
		}
	}
	
	if (!usr)
	{
		usr = SeSRequestString(
			"Salesforce Username",
			"Enter Salesforce username",
			""
		);
		if (!usr)
		{
			Tester.Message("Salesforce username is not set. Do it via Parameters tab in the Spira Dashboard.");
			return false;
		}
		else
		{
			Global.SetProperty("UserName", usr, "%WORKDIR%\\Shared\\Config.xlsx");
		}
	}
	
	if (!pwd)
	{
		pwd = SeSRequestString(
			"Salesforce Password",
			"Enter Salesforce password",
			""
		);
		if (!pwd)
		{
			Tester.Message("Salesforce password is not set. Do it via Parameters tab in the Spira Dashboard.");
			return false;
		}
		else
		{
			Global.SetProperty("Password", pwd, "%WORKDIR%\\Shared\\Config.xlsx");
		}
	}
		
	LoginSfdc(url, usr, pwd);
	SfdcEnterOTP();
	
	if (Navigator.DoWaitFor("//button[@title='App Launcher']", 30000))
	{
		Global.DoSleep(5000);
	}
	
	return true;
}

var _paramInfoSfdc_Launch = {
	_: function ()
	{
		/**
		 * Launch Salesforce in a browser and log in.
		 *
		 * Credentials and the login URL are resolved in this order: environment variables
		 * (`SF_URL`, `SF_USERNAME`, `SF_PASSWORD`), test parameters (`SfdcUrl`, `SfdcUserName`,
		 * `SfdcPassword`), then `Shared\Config.xlsx`. If any value is still unknown, Rapise
		 * prompts for it and saves the answer into `Shared\Config.xlsx`.
		 *
		 * When two-factor authentication is enabled, the OTP secret is resolved similarly
		 * (`SF_OTP` environment variable, `OTP Secret` test parameter, or `Secret` in
		 * `Shared\Config.xlsx`). The `OTP` public module must be installed.
		 *
		 * Examples:
```javascript
Sfdc.Launch();
```
		 */
	},
	_type: "boolean",
	_returns: "true if the login completed and the home page loaded, false if a required setting was not provided."
};

function SfdcEnterOTP()
{
	var otpField = Navigator.DoWaitFor("//input[@id='tc']", 3000);
	if(otpField)
	{
		if (typeof(OTP) == "undefined")
		{
			Tester.Assert("Please, install OTP public module to generate one-time passwords.", false);
			return;
		}

		var secret = Global.GetEnv('SF_OTP');
		if (!secret)
		{
			secret = Tester.GetParam("OTP Secret");
		}
		if (!secret)
		{
			secret = Global.GetProperty("Secret", "", "%WORKDIR%\\Shared\\Config.xlsx");
		}
		if (!secret)
		{
			secret = SeSRequestString(
				"OTP Secret",
				"Enter OTP secret key (for 2FA)",
				""
			);
			if (!secret)
			{
				Tester.Message("OTP secret is not set. Do it via Parameters tab in the Spira Dashboard.");
				return false;
			}
			else
			{
				Global.SetProperty("Secret", secret, "%WORKDIR%\\Shared\\Config.xlsx");
			}
		}
		
		var otp = OTP.GetCode(secret);
		otpField._DoSetText(otp)
		
		var otpButton = Navigator.Find("//input[@id='save']");
		if (otpButton)
		{
			otpButton.object_name = "Verify OTP";
			otpButton.DoClick();
		}
	}
}

function Sfdc_OpenApp(/**string*/ app)
{
	function _clickApp()
	{
		var xpath = "//a[@data-label='" + app + "']";
		var obj = Navigator.DoWaitFor(xpath, 3000);
		if (obj)
		{
			obj.object_name = app;
			return obj.DoLClick();
		}
		return false;
	}

	var appLauncher = Navigator.SeSFind("//button[@title='App Launcher']")
	if (!appLauncher)
	{
		return false;
	}
	
	appLauncher.DoClick(5,5);
	if (!_clickApp())
	{
		// it may be hidden inside View All
		var viewAllObj = Navigator.SeSFind("//button[text()='View All']");
		if (viewAllObj)
		{
			viewAllObj.object_name = "View All";
			viewAllObj.DoClick();
			if (!_clickApp())
			{
				Tester.Assert("App element is not found: " + app, false);
				return false;
			}
			else
			{
				Global.DoSleep(1000);
				return true;
			}
		}
		return false;
	}
	
	Global.DoSleep(1000);
	return true;
}

var _paramInfoSfdc_OpenApp = {
	_: function ()
	{
		/**
		 * Open a Salesforce application from the App Launcher (Waffle menu).
		 *
		 * Clicks the waffle icon, searches for the application by name, and clicks it.
		 * If the app is not visible in the initial list, the "View All" button is clicked
		 * to show the full app list.
		 *
		 * Examples:
```javascript
Sfdc.OpenApp("Sales");
```
		 */
	},
	_type: "boolean",
	_returns: "true if the application was found and clicked, false otherwise.",
	app: {
		description: "Name of the application to open (e.g. Sales, Service, Marketing).",
		type: "string",
		defaultValue: "Sales"
	}
};

function Sfdc_NavigateModule(/**string*/ module)
{
	var xpath = "//one-app-nav-bar-item-root/a[@title='" + module + "']";
	var obj = Navigator.SeSFind(xpath);
	if (obj)	
	{
		obj.object_name = module;
		return obj.DoLClick();
	}
	else
	{
		Tester.Assert("Module element is not found: " + module, false);
	}
	return false;
}

var _paramInfoSfdc_NavigateModule = {
	_: function ()
	{
		/**
		 * Navigate to a module using the navigation bar.
		 *
		 * Clicks the module link in the top navigation bar to open that module's list view.
		 *
		 * Examples:
```javascript
Sfdc.NavigateModule("Leads");
```
		 */
	},
	_type: "boolean",
	_returns: "true if the module link was found and clicked, false otherwise.",
	module: {
		description: "Name of the module to navigate to (e.g. Leads, Contacts, Opportunities, Accounts).",
		type: "string",
		defaultValue: "Leads"
	}
};

function Sfdc_SelectListView(/**string*/ view)
{
	var listView = Navigator.SeSFind("//lst-list-view-picker");
	if (listView)
	{
		return false;
	}

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
		return obj.DoClick();
	}
	else
	{
		Tester.Assert("View element is not found: " + view, false);
	}
	return false;
}

var _paramInfoSfdc_SelectListView = {
	_: function ()
	{
		/**
		 * Select a list view from the list view dropdown.
		 *
		 * Opens the list view selector and clicks the specified view option.
		 *
		 * Examples:
```javascript
Sfdc.SelectListView("Recently Viewed");
```
		 */
	},
	_type: "boolean",
	_returns: "true if the view was found and selected, false otherwise.",
	view: {
		description: "Name of the list view to select (e.g. Recently Viewed, All Open Leads).",
		type: "string",
		defaultValue: "Recently Viewed"
	}
};

function Sfdc_ClickButton(/**string*/ name)
{
	var xpaths = [
		"//div[@title='" + name + "']",
		"//button[@name='" + name + "']",
		"//button[normalize-space(.)='" + name + "' and not(@disabled)]",
		"//button[@title='" + name + "' and not(@disabled)]"
	];
	var xpath = xpaths.join("|");
	var obj = Navigator.SeSFind(xpath);
	if (obj)
	{
		var activeDivXpaths = [
			"//div[contains(@class, 'isModal') and contains(@class, 'active')]",
			"//div[contains(@class, 'oneContent') and contains(@class, 'active')]",
			"//div[contains(@class, 'active')]"
		];
		var relParts = [];
		for (var i = 0; i < xpaths.length; i++) relParts.push("." + xpaths[i]);
		var relXpath = relParts.join("|");
		for (var d = 0; d < activeDivXpaths.length; d++)
		{
			var activeDiv = Navigator.Find(activeDivXpaths[d]);
			if (activeDiv)
			{
				var scoped = activeDiv._DoDOMQueryXPath(relXpath);
				if (scoped && scoped.length > 0)
				{
					obj = scoped[0];
					break;
				}
			}
		}
		obj.object_name = name;
		return obj.DoClick();
	}
	else
	{
		Tester.Assert("Button '" + name + "' is not found", false);
	}
	return false;
}

var _paramInfoSfdc_ClickButton = {
	_: function ()
	{
		/**
		 * Click a button by its name or title.
		 *
		 * Searches for the button by its `name` attribute, `title` attribute, or visible text.
		 * When inside a modal dialog, the button within the active modal is preferred.
		 *
		 * Examples:
```javascript
Sfdc.ClickButton("Save");
```
		 */
	},
	_type: "boolean",
	_returns: "true if the button was found and clicked, false otherwise.",
	name: {
		description: "Name, title, or visible text of the button to click.",
		type: "string",
		defaultValue: "Save"
	}
};

function Sfdc_SetTextField(/**string*/ name, /**string*/ value)
{
	var labelCondition = "normalize-space(.)='" + name + "' or normalize-space(.)='*" + name + "' or normalize-space(.)='" + name + "*'";
	var xpaths = [
		"//input[@name='" + name + "' or @placeholder='" + name + "']",
		"//input[@id=//label[" + labelCondition + "]/@for]",
		"//textarea[@id=//label[" + labelCondition + "]/@for]"
	];
	var xpath = xpaths.join("|");

	var obj = Navigator.SeSFind(xpath);
	if (obj)
	{
		if (obj.GetTag().toLowerCase() == "table")
		{
			var relParts = [];
			for (var i = 0; i < xpaths.length; i++) relParts.push("." + xpaths[i]);
			var relXpath = relParts.join("|");
			var scoped = obj._DoDOMQueryXPath(relXpath);
			if (scoped && scoped.length > 0)
			{
				obj = scoped[0];
			}
		}

		obj.object_name = name;
		return obj.DoSetText(value);
	}
	else
	{
		Tester.Assert("Input field '" + name + "' is not found", false);
	}
	return false;
}

var _paramInfoSfdc_SetTextField = {
	_: function ()
	{
		/**
		 * Set text into a form field.
		 *
		 * Finds the input or textarea by its label text, `name` attribute, or `placeholder`
		 * attribute, and enters the specified value.
		 *
		 * Examples:
```javascript
Sfdc.SetTextField("Last Name", "Smith");
```
		 */
	},
	_type: "boolean",
	_returns: "true if the field was found and the text was set, false otherwise.",
	name: {
		description: "Label, name, or placeholder of the input field.",
		type: "string",
		defaultValue: "Last Name"
	},
	value: {
		description: "Text to enter into the field.",
		type: "string",
		defaultValue: ""
	}
};

function Sfdc_SetCheckbox(/**string*/ name, /**boolean*/ state)
{
	var labelCondition = "normalize-space(.)='" + name + "' or normalize-space(.)='*" + name + "'";
	// Find checkbox input by label association or by name attribute
	var xpath = "//input[@type='checkbox' and @name='" + name + "']";
	xpath += "|//input[@type='checkbox' and @id=//label[" + labelCondition + "]/@for]";
	xpath += "|//lightning-input[.//span[contains(@class,'slds-form-element__label') and " + labelCondition + "]]//input[@type='checkbox']";

	var obj = Navigator.SeSFind(xpath);
	if (obj)
	{
		obj.object_name = name;
		var isChecked = WebDriver.ExecuteScript("return arguments[0].checked", obj.element.e);
		if ((state && !isChecked) || (!state && isChecked))
		{
			var aw = WebDriver.autoWait;
			WebDriver.autoWait = false;
			var result = obj.DoClick();
			WebDriver.autoWait = aw;
			return result;
		}
		// Already in the desired state
		return true;
	}
	else
	{
		Tester.Assert("Checkbox field '" + name + "' is not found", false);
	}
	return false;
}

var _paramInfoSfdc_SetCheckbox = {
	_: function ()
	{
		/**
		 * Set a checkbox on a form to the specified state.
		 *
		 * Finds the checkbox by its label text or `name` attribute and checks or unchecks it.
		 * If the checkbox is already in the desired state, no action is taken.
		 *
		 * Examples:
```javascript
Sfdc.SetCheckbox("Do Not Call", true);
```
		 */
	},
	_type: "boolean",
	_returns: "true if the checkbox was found and set to the desired state, false otherwise.",
	name: {
		description: "Label or name of the checkbox field.",
		type: "string",
		defaultValue: ""
	},
	state: {
		description: "Desired state: true to check, false to uncheck.",
		type: "boolean",
		defaultValue: true
	}
};

function Sfdc_VerifyDetailsField(/**string*/ name, /**string*/ value)
{
	var xpath = "//div[contains(@class, 'active')]//div[(contains(@class,'test-id__output-root') or contains(@class,'slds-form-element_readonly')) and .//span[contains(@class,'test-id__field-label') and normalize-space(.)='" + name + "']]//span[contains(@class,'test-id__field-value')]";
	var actual = "";
	var obj = null;
	SfdcAutoWait(function() {
		obj = Navigator.Find(xpath);
		if (obj)
		{
			obj.object_name = name;
			// Check if this is a checkbox field
			var checkbox = obj._DoDOMQueryXPath(".//lightning-primitive-input-checkbox");
			if (checkbox && checkbox.length)
			{
				var isChecked = WebDriver.ExecuteScript("return arguments[0].checked", checkbox[0].element.e);
				actual = isChecked ? "true" : "false";
			}
			else
			{
				var link = obj._DoDOMQueryXPath(".//a");
				actual = (link && link.length) ? link[0].GetText() : obj.GetText();
			}
			return ("" + actual) == ("" + value);
		}
		return false;
	});
	if (!obj)
	{
		Tester.Assert("Details field '" + name + "' is not found", false);
		return false;
	}
	Tester.AssertEqual("Verify field '" + name + "'", value, actual);
	return true;
}

var _paramInfoSfdc_VerifyDetailsField = {
	_: function ()
	{
		/**
		 * Verify the value of a field on a record detail page.
		 *
		 * Finds the field by its label and compares the displayed value to the expected one.
		 * Supports text fields, links, and checkbox fields.
		 *
		 * Examples:
```javascript
Sfdc.VerifyDetailsField("Account Name", "Acme Corp");
```
		 */
	},
	_type: "boolean",
	_returns: "true if the field value matches the expected value, false otherwise.",
	name: {
		description: "Label of the field to verify.",
		type: "string",
		defaultValue: ""
	},
	value: {
		description: "Expected value of the field.",
		type: "string",
		defaultValue: ""
	}
};

function Sfdc_VerifyCardDetail(/**string*/ cardName, /**string*/ itemName, /**string*/ fieldName, /**string*/ value)
{
	var articleXpath = "//article[@aria-label='" + cardName + "']";

	// Scope to the specific item container by matching the item name in a link or text
	// Pattern A: Aura layout — article.listItemBody with item name in an anchor inside h3.primaryField
	var itemScopeAura = articleXpath + "//article[contains(@class,'listItemBody') and .//h3[contains(@class,'primaryField')]//a[normalize-space(.)='" + itemName + "']]";
	// Pattern B: Lightning lst-related-preview-card — article with item name in a link
	var itemScopeLwc = articleXpath + "//lst-related-preview-card[.//a[normalize-space(.)='" + itemName + "']]";
	// Pattern C: Fallback — any container inside the card article that has the item name link
	var itemScopeFallback = articleXpath + "//*[self::article or self::lst-related-preview-card or self::lst-template-list-item-factory][.//a[normalize-space(.)='" + itemName + "']]";

	var actual = "";
	var obj = null;

	SfdcAutoWait(function() {
		// Try to find the item scope
		var itemContainer = Navigator.Find(itemScopeAura);
		if (!itemContainer)
		{
			itemContainer = Navigator.Find(itemScopeLwc);
		}
		if (!itemContainer)
		{
			itemContainer = Navigator.Find(itemScopeFallback);
		}

		if (itemContainer)
		{
			// Within the item container, find the field value
			// Pattern 1: forceListRecordItem layout (div.recordCellLabel + div.recordCellDetail)
			var relDivXpath = ".//div[contains(@class,'forceListRecordItem') and .//div[contains(@class,'recordCellLabel') and (normalize-space(.)='" + fieldName + ":' or normalize-space(.)='" + fieldName + "')]]//div[contains(@class,'recordCellDetail')]";
			var results = itemContainer._DoDOMQueryXPath(relDivXpath);
			if (results && results.length)
			{
				obj = results[0];
			}
			else
			{
				// Pattern 2: dt/dd pairs
				var relDtXpath = ".//dt[normalize-space(.)='" + fieldName + ":' or normalize-space(.)='" + fieldName + "']/following-sibling::dd[1]";
				results = itemContainer._DoDOMQueryXPath(relDtXpath);
				if (results && results.length)
				{
					obj = results[0];
				}
			}
		}

		if (obj)
		{
			obj.object_name = cardName + " > " + itemName + " > " + fieldName;
			// Try to get text from a span with title attribute first (most reliable)
			var spanWithTitle = obj._DoDOMQueryXPath(".//span[@title]");
			if (spanWithTitle && spanWithTitle.length)
			{
				actual = spanWithTitle[0]._DoDOMGetAttribute("title");
			}
			else
			{
				actual = obj.GetText().trim();
			}
			return ("" + actual) == ("" + value);
		}
		return false;
	});

	if (!obj)
	{
		Tester.Assert("Card '" + cardName + "' item '" + itemName + "' field '" + fieldName + "' is not found", false);
		return false;
	}

	Tester.AssertEqual("Verify card '" + cardName + "' item '" + itemName + "' field '" + fieldName + "'", value, actual);
	return ("" + actual) == ("" + value);
}

var _paramInfoSfdc_VerifyCardDetail = {
	_: function ()
	{
		/**
		 * Verify a field value displayed inside a related list card (preview card layout).
		 *
		 * Locates the related list card by its aria-label, finds the specific item by name,
		 * then reads and verifies the field value.
		 *
		 * Examples:
```javascript
Sfdc.VerifyCardDetail("Products", "AutoProduct Basic", "Sales Price", "$100.00");
```
		 */
	},
	_type: "boolean",
	_returns: "true if the field value matches the expected value, false otherwise.",
	cardName: {
		description: "Name of the related list card (matches aria-label, e.g. Products, Contact Roles).",
		type: "string",
		defaultValue: "Products"
	},
	itemName: {
		description: "Name of the item within the card to scope the lookup.",
		type: "string",
		defaultValue: ""
	},
	fieldName: {
		description: "Label of the field to verify (e.g. Sales Price, Quantity, Role).",
		type: "string",
		defaultValue: ""
	},
	value: {
		description: "Expected value text.",
		type: "string",
		defaultValue: ""
	}
};

function Sfdc_SearchTable(/**string*/ value)
{
	var xpath = "//input[@type='search' and @class='slds-input']|//input[contains(@class,'search-text-field')]";
	var obj = Navigator.SeSFind(xpath);
	if (obj)	
	{
		obj.object_name = "Search";
		obj.DoClick();
		obj.DoSetText(value);
		Global.DoSleep(500);
		WebDriver.Actions().SendKeys('\uE007').Perform();
		Global.DoSleep(2000);
		return true;
	}
	else
	{
		Tester.Assert("Search element is not found", false);
	}
	return false;
}

var _paramInfoSfdc_SearchTable = {
	_: function ()
	{
		/**
		 * Search data in a list view table.
		 *
		 * Enters the search value into the table's search input and presses Enter.
		 *
		 * Examples:
```javascript
Sfdc.SearchTable("Acme");
```
		 */
	},
	_type: "boolean",
	_returns: "true if the search input was found and the search was performed, false otherwise.",
	value: {
		description: "Text to search for in the table.",
		type: "string",
		defaultValue: ""
	}
};

function Sfdc_SelectComboboxItem(/**string*/ name, /**string*/ item)
{
	var xpath = "//lightning-combobox[.//label[text()='" + name + "' or text()='*" + name + "']]"
		+ "|//div[contains(@class,'forceInputPicklist') and .//span[normalize-space(.)='" + name + "']]"
		+ "|//div[contains(@class,'uiInputSelect') and .//label[contains(.,'" + name + "')]]";
	var obj = Navigator.SeSFind(xpath);
	if (!obj)
	{
		Tester.Assert("Combobox element is not found: " + name, false);
		return false;
	}
	
	obj.object_name = name;
	obj._DoEnsureVisible();
	var tag = obj.GetTag().toLowerCase();
	
	if (tag === "lightning-combobox")
	{
		// Lightning combobox
		var openButton = obj._DoDOMQueryXPath('.//button[@role="combobox"]');
		if (openButton && openButton.length)
		{
			openButton[0].DoLClick();
		}
		else
		{
			obj.DoClick(obj.GetWidth() - 20);
		}
		Global.DoSleep(500);
		var itemObj = obj._DoDOMQueryXPath("//lightning-base-combobox-item[.//span[@title='" + item + "']]");
		if (itemObj && itemObj.length)
		{
			itemObj[0].object_name = item;
			return itemObj[0].DoClick();
		}
		else
		{
			Tester.Assert("Item element is not found: " + item, false);
		}
	}
	else
	{
		// Check for native <select> element (uiInputSelect)
		var selectEl = obj._DoDOMQueryXPath(".//select");
		if (selectEl && selectEl.length)
		{
			selectEl[0].object_name = name;
			return selectEl[0].DoSelect(item);
		}
		
		// Classic Aura picklist (forceInputPicklist)
		var trigger = obj._DoDOMQueryXPath(".//a[@role='button' and @aria-haspopup='true']");
		if (trigger && trigger.length)
		{
			trigger[0].DoClick();
		}
		else
		{
			obj.DoClick();
		}
		Global.DoSleep(500);
		var auraItemXpath = "//a[@role='option' and @title='" + item + "']";
		var auraItem = Navigator.DoWaitFor(auraItemXpath, 5000);
		if (auraItem)
		{
			if (auraItem.DoSelectItem)
			{
				return auraItem._DoSelectItem(item);
			}
			auraItem.object_name = item;
			return auraItem.DoClick();
		}
		else
		{
			Tester.Assert("Picklist item '" + item + "' is not found for field '" + name + "'", false);
		}
	}
	return false;
}

var _paramInfoSfdc_SelectComboboxItem = {
	_: function ()
	{
		/**
		 * Select an item from a combobox (picklist).
		 *
		 * Supports Lightning combobox (`lightning-combobox`), classic Aura picklist
		 * (`forceInputPicklist`), and native HTML select elements (`uiInputSelect`).
		 *
		 * Examples:
```javascript
Sfdc.SelectComboboxItem("Lead Status", "Working - Contacted");
```
		 */
	},
	_type: "boolean",
	_returns: "true if the item was found and selected, false otherwise.",
	name: {
		description: "Label of the combobox field.",
		type: "string",
		defaultValue: ""
	},
	item: {
		description: "Text of the item to select.",
		type: "string",
		defaultValue: ""
	}
};

function Sfdc_SelectLookupItem(/**string*/ name, /**string*/ item)
{
	var xpath = "//input[@aria-label='" + name + "' and @role='combobox']"
		+ "|//input[@id=//label[normalize-space(.)='" +name + "']/@for and @role='combobox']";
	var obj = Navigator.SeSFind(xpath);
	if (obj)
	{
		obj.object_name = name;
		obj.DoClick();
		Global.DoSleep(500);
		obj.DoSetText(item);
		Global.DoSleep(1000);

		var itemXpath = "//lightning-base-combobox-item//*[@title='" + item + "']"
			+ "|//lightning-formatted-rich-text[normalize-space(.)='" + item + "']";
		var itemObj = Navigator.DoWaitFor(itemXpath, 5000);
		if (itemObj)
		{
			itemObj.object_name = item;
			return itemObj.DoClick();
		}
		else
		{
			Tester.Assert("Lookup item '" + item + "' is not found for field '" + name + "'", false);
		}
	}
	else
	{
		Tester.Assert("Lookup field '" + name + "' is not found", false);
	}
	return false;
}

var _paramInfoSfdc_SelectLookupItem = {
	_: function ()
	{
		/**
		 * Select an item from a lookup field.
		 *
		 * Types the item name into the lookup field, waits for search results,
		 * and clicks the matching item.
		 *
		 * Examples:
```javascript
Sfdc.SelectLookupItem("Account Name", "Acme Corp");
```
		 */
	},
	_type: "boolean",
	_returns: "true if the item was found and selected, false otherwise.",
	name: {
		description: "Label of the lookup field.",
		type: "string",
		defaultValue: ""
	},
	item: {
		description: "Name of the item to search for and select.",
		type: "string",
		defaultValue: ""
	}
};

function Sfdc_SelectInnerTab(/**string*/ name)
{
	var css = "css=a[data-label='" + name + "']:visible";
	var obj = Navigator.SeSFind(css);
	if (obj)
	{
		obj.object_name = name;
		return obj.DoClick();
	}
	else
	{
		Tester.Assert("Inner tab '" + name + "' is not found", false);
	}
	return false;
}

var _paramInfoSfdc_SelectInnerTab = {
	_: function ()
	{
		/**
		 * Select an inner tab on a record page.
		 *
		 * Clicks the tab link to switch to that tab's content.
		 *
		 * Examples:
```javascript
Sfdc.SelectInnerTab("Details");
```
		 */
	},
	_type: "boolean",
	_returns: "true if the tab was found and clicked, false otherwise.",
	name: {
		description: "Name of the tab to select (e.g. Details, Activity, Related).",
		type: "string",
		defaultValue: "Details"
	}
};

function Sfdc_SetPathStep(/**string*/ name)
{
	var xpath = "//a[@data-tab-name='" + name + "' and contains(@class,'slds-path__link')]";
	var obj = Navigator.SeSFind(xpath);
	if (obj)
	{
		var res = obj.DoSelectItem ? obj._DoSelectItem(name) : obj.DoClick();
		Global.DoSleep(1000);
		Tester.Assert("Path step '" + name + "' is set", res);
		return res;
	}
	else
	{
		Tester.Assert("Path step '" + name + "' is not found", false);
	}
	return false;
}

var _paramInfoSfdc_SetPathStep = {
	_: function ()
	{
		/**
		 * Set the active Path step on a record page.
		 *
		 * Clicks the specified step in the Path component to mark it as current.
		 *
		 * Examples:
```javascript
Sfdc.SetPathStep("Qualification");
```
		 */
	},
	_type: "boolean",
	_returns: "true if the step was found and set, false otherwise.",
	name: {
		description: "Name of the Path step to set as active.",
		type: "string",
		defaultValue: "Qualification"
	}
};

function Sfdc_AddReportFilter(/**string*/ filter, /**string*/ operator, /**string*/ value)
{
	var iframePrefix = "//iframe[@title='Report Builder']@@@";

	// Click the "Add filter..." input to open the filter list
	var addFilterInput = Navigator.SeSFind(iframePrefix + "//input[@placeholder='Add filter...' and @type='text' and @role='textbox']");
	if (!addFilterInput)
	{
		Tester.Assert("'Add filter...' input not found", false);
		return false;
	}
	addFilterInput.object_name = "Add filter...";
	addFilterInput.DoClick();
	Global.DoSleep(500);

	// Select the filter field from the listbox
	var filterList = Navigator.SeSFind(iframePrefix + "//ul[@role='listbox' and contains(@class,'report-combobox-listbox')]");
	if (!filterList)
	{
		Tester.Assert("Filter listbox not found", false);
		return false;
	}
	var filterItems = filterList._DoDOMQueryXPath(".//li[@role='option']//span[@title='" + filter + "']");
	if (!filterItems || !filterItems.length)
	{
		Tester.Assert("Filter field '" + filter + "' not found in the list", false);
		return false;
	}
	filterItems[0].object_name = filter;
	filterItems[0].DoClick();
	Global.DoSleep(1000);

	// Select the operator from the picklist
	var operatorButton = Navigator.SeSFind(iframePrefix + "//button[contains(@class,'slds-picklist__label')]");
	if (!operatorButton)
	{
		Tester.Assert("Operator picklist button not found", false);
		return false;
	}
	operatorButton.object_name = "Operator";
	operatorButton.DoClick();
	Global.DoSleep(500);

	var operatorItemXpath = iframePrefix + "//ul[@role='menu']//span[contains(@class,'picklistLabel') and normalize-space(.)='" + operator + "']";
	var operatorItem = Navigator.DoWaitFor(operatorItemXpath, 5000);
	if (!operatorItem)
	{
		Tester.Assert("Operator '" + operator + "' not found in the list", false);
		return false;
	}
	operatorItem.object_name = operator;
	operatorItem.DoClick();
	Global.DoSleep(500);

	// Enter the filter value
	var valueInput = Navigator.SeSFind(iframePrefix + "//input[@id='undefined-input' and contains(@class,'slds-input') and @type='text']");
	if (!valueInput)
	{
		Tester.Assert("Filter value input not found", false);
		return false;
	}
	valueInput.object_name = "Filter Value";
	valueInput.DoSetText(value);
	Global.DoSleep(500);

	// Click the Apply button
	var applyButton = Navigator.SeSFind(iframePrefix + "//button[contains(@class,'filter-apply')]");
	if (!applyButton)
	{
		Tester.Assert("Apply button not found", false);
		return false;
	}
	applyButton.object_name = "Apply";
	applyButton.DoClick();
	Global.DoSleep(1000);

	return true;
}

var _paramInfoSfdc_AddReportFilter = {
	_: function ()
	{
		/**
		 * Add a filter to a report in the Report Builder.
		 *
		 * Opens the filter selector, chooses the field, selects the operator,
		 * enters the value, and applies the filter.
		 *
		 * Examples:
```javascript
Sfdc.AddReportFilter("Account Name", "contains", "Auto");
```
		 */
	},
	_type: "boolean",
	_returns: "true if the filter was added successfully, false otherwise.",
	filter: {
		description: "Name of the filter field (e.g. Account Name, Amount).",
		type: "string",
		defaultValue: "Account Name"
	},
	operator: {
		description: "Filter operator (e.g. contains, equals, greater than).",
		type: "string",
		defaultValue: "contains"
	},
	value: {
		description: "Value to filter by.",
		type: "string",
		defaultValue: ""
	}
};

function Sfdc_FormatDate(/**number*/ offsetDays, /**string*/ baseDate)
{
	/** 
	 * The format is read from Config.xlsx key "DateFormat" (default: "M/d/yyyy" — US locale).
	 * Supported tokens: M, MM, d, dd, yyyy, yy.
	 */
	
	offsetDays = offsetDays || 0;
	baseDate = baseDate || "today";

	var dt = null;
	if (baseDate === "today")
	{
		dt = new Date();
	}
	else
	{
		dt = new Date(baseDate);
		if (isNaN(dt.getTime()))
		{
			Tester.Assert("FormatDate: invalid baseDate '" + baseDate + "'", false);
			return "";
		}
	}

	dt.setDate(dt.getDate() + offsetDays);

	var fmt = Global.GetProperty("DateFormat", "M/d/yyyy", "%WORKDIR%\\Shared\\Config.xlsx");

	var month = dt.getMonth() + 1;
	var day = dt.getDate();
	var year = dt.getFullYear();

	// Replace longer tokens first to avoid partial matches (MM before M, dd before d)
	var result = fmt;
	if (result.indexOf("MM") !== -1)
	{
		result = result.replace("MM", ("0" + month).slice(-2));
	}
	else
	{
		result = result.replace("M", "" + month);
	}
	if (result.indexOf("dd") !== -1)
	{
		result = result.replace("dd", ("0" + day).slice(-2));
	}
	else
	{
		result = result.replace("d", "" + day);
	}
	if (result.indexOf("yyyy") !== -1)
	{
		result = result.replace("yyyy", "" + year);
	}
	else
	{
		result = result.replace("yy", ("" + year).slice(-2));
	}

	Tester.Message("FormatDate: " + result + " (offset=" + offsetDays + ", base=" + baseDate + ")");
	return result;
}

var _paramInfoSfdc_FormatDate = {
	_: function ()
	{
		/**
		 * Compute a date relative to today (or a given base) and return it formatted
		 * for Salesforce date input fields.
		 *
		 * The format is read from `Config.xlsx` key `DateFormat` (default: `M/d/yyyy` — US locale).
		 * Supported tokens: `M`, `MM`, `d`, `dd`, `yyyy`, `yy`.
		 *
		 * Examples:
```javascript
Sfdc.FormatDate(60);
```
		 */
	},
	_type: "string",
	_returns: "Formatted date string ready for SetTextField, or empty string on error.",
	offsetDays: {
		description: "Number of days to add (can be negative). Default 0.",
		type: "number",
		defaultValue: 0,
		optional: true
	},
	baseDate: {
		description: "Base date string (ISO format yyyy-MM-dd) or 'today'. Default 'today'.",
		type: "string",
		defaultValue: "today",
		optional: true
	}
};

function Sfdc_RelatedListAction(/**string*/ listName, /**string*/ actionName)
{
	// Find the related list article by aria-label
	var articleXpath = "//div[contains(@class,'active')]//article[@aria-label='" + listName + "']";
	var article = Navigator.SeSFind(articleXpath);
	if (!article)
	{
		Tester.Assert("Related list '" + listName + "' is not found", false);
		return false;
	}

	article.object_name = listName;
	article._DoEnsureVisible();
	Global.DoSleep(500);

	// Try the most common dropdown trigger pattern first (simple forceDeferredDropDownAction)
	var triggerXpath = articleXpath + "//div[contains(@class,'forceDeferredDropDownAction')]//a[@role='button' and @aria-haspopup='true']";
	var trigger = Navigator.Find(triggerXpath);

	if (!trigger)
	{
		// Fallback: actions ribbon pattern (oneActionsDropDown > uiMenu)
		triggerXpath = articleXpath + "//li[contains(@class,'oneActionsDropDown')]//a[@role='button' and @aria-haspopup='true']";
		trigger = Navigator.Find(triggerXpath);
	}

	if (!trigger)
	{
		Tester.Assert("Dropdown trigger not found for related list '" + listName + "'", false);
		return false;
	}

	trigger.object_name = listName + " dropdown";
	trigger.DoClick();
	Global.DoSleep(500);

	// Find and click the menu item
	var itemXpath = "(//a[@role='menuitem' and @title='" + actionName + "'])[last()]"
		+ "|(//a[@role='menuitem']//div[@title='" + actionName + "'])[last()]";
	var item = Navigator.SeSFind(itemXpath);
	if (!item)
	{
		Tester.Assert("Menu item '" + actionName + "' not found in related list '" + listName + "'", false);
		return false;
	}

	item.object_name = actionName;
	return item.DoClick();
}

var _paramInfoSfdc_RelatedListAction = {
	_: function ()
	{
		/**
		 * Click an action from a Related List's dropdown menu.
		 *
		 * Locates the related list by its aria-label, opens the dropdown trigger,
		 * and selects the specified menu item.
		 *
		 * Examples:
```javascript
Sfdc.RelatedListAction("Products", "Add Products");
```
		 */
	},
	_type: "boolean",
	_returns: "true if the action was found and clicked, false otherwise.",
	listName: {
		description: "Name of the related list (e.g. Contact Roles, Products).",
		type: "string",
		defaultValue: "Products"
	},
	actionName: {
		description: "Name of the action in the dropdown menu.",
		type: "string",
		defaultValue: "Add Products"
	}
};

function Sfdc_RelatedListItemAction(/**string*/ listName, /**string*/ itemName, /**string*/ actionName)
{
	// Find the related list article by aria-label
	var articleXpath = "//article[@aria-label='" + listName + "']";
	var article = Navigator.SeSFind(articleXpath);
	if (!article)
	{
		Tester.Assert("Related list '" + listName + "' is not found", false);
		return false;
	}

	article.object_name = listName;
	article._DoEnsureVisible();
	Global.DoSleep(500);

	// Find the list item that contains a link with the item name
	var itemXpath = articleXpath + "//li[contains(@class,'forceRecordLayout') and .//a[normalize-space(.)='" + itemName + "']]";
	var itemRow = Navigator.Find(itemXpath);
	if (!itemRow)
	{
		Tester.Assert("Item '" + itemName + "' not found in related list '" + listName + "'", false);
		return false;
	}

	itemRow.object_name = itemName;

	// Find the row-level dropdown trigger within this item
	var triggerXpath = ".//li[contains(@class,'oneActionsDropDown')]//a[@role='button' and @aria-haspopup='true']";
	var triggers = itemRow._DoDOMQueryXPath(triggerXpath);

	if (!triggers || !triggers.length)
	{
		// Fallback: try the placeholder row action link
		triggerXpath = ".//a[contains(@class,'rowActionsPlaceHolder') and @role='button' and @aria-haspopup='true']";
		triggers = itemRow._DoDOMQueryXPath(triggerXpath);
	}

	if (!triggers || !triggers.length)
	{
		Tester.Assert("Row action trigger not found for item '" + itemName + "' in related list '" + listName + "'", false);
		return false;
	}

	var trigger = triggers[0];
	trigger.object_name = itemName + " actions";
	trigger.DoClick();
	Global.DoSleep(1000);

	// Find and click the menu item
	var menuItemXpath = "(//a[@role='menuitem' and @title='" + actionName + "'])[last()]";
	var menuItem = Navigator.SeSFind(menuItemXpath);
	if (!menuItem)
	{
		Tester.Assert("Action '" + actionName + "' not found for item '" + itemName + "' in related list '" + listName + "'", false);
		return false;
	}

	menuItem.object_name = actionName;
	return menuItem.DoClick();
}

var _paramInfoSfdc_RelatedListItemAction = {
	_: function ()
	{
		/**
		 * Click an action from a specific item's dropdown menu within a Related List.
		 *
		 * Locates the item row by name within the related list, opens its dropdown,
		 * and clicks the specified action.
		 *
		 * Examples:
```javascript
Sfdc.RelatedListItemAction("Products", "AutoProduct Basic", "Edit");
```
		 */
	},
	_type: "boolean",
	_returns: "true if the action was found and clicked, false otherwise.",
	listName: {
		description: "Name of the related list (e.g. Products, Contact Roles).",
		type: "string",
		defaultValue: "Products"
	},
	itemName: {
		description: "Name/text of the item row.",
		type: "string",
		defaultValue: ""
	},
	actionName: {
		description: "Name of the action in the row dropdown (e.g. Edit, Delete).",
		type: "string",
		defaultValue: "Edit"
	}
};

function Sfdc_VerifyRecordTitle(/**string*/ entityName, /**string*/ recordName)
{
	var activePaneXpath = "//div[contains(@class, 'active')]"; 
	var entityXpath = activePaneXpath + "//records-entity-label";
	var recordXpathText = activePaneXpath + "//records-entity-label/ancestor::h1//slot[@name='primaryField']/lightning-formatted-text";
	var recordXpathName = activePaneXpath + "//records-entity-label/ancestor::h1//slot[@name='primaryField']/lightning-formatted-name";

	var actualEntity = "";
	var actualRecord = "";
	var entityObj = null;
	var recordObj = null;

	SfdcAutoWait(function() {
		entityObj = Navigator.Find(entityXpath);
		recordObj = Navigator.Find(recordXpathText);
		if (!recordObj)
		{
			recordObj = Navigator.Find(recordXpathName);
		}

		if (entityObj)
		{
			actualEntity = entityObj.GetText().trim();
		}
		if (recordObj)
		{
			actualRecord = recordObj.GetText().trim();
		}

		return actualEntity === entityName && actualRecord === recordName;
	});

	if (!entityObj)
	{
		Tester.Assert("Entity label element is not found on the record page", false);
		return false;
	}
	if (!recordObj)
	{
		Tester.Assert("Record name element is not found on the record page", false);
		return false;
	}

	var entityPass = Tester.AssertEqual("Verify entity type", entityName, actualEntity);
	var recordPass = Tester.AssertEqual("Verify record name", recordName, actualRecord);
	return entityPass && recordPass;
}

var _paramInfoSfdc_VerifyRecordTitle = {
	_: function ()
	{
		/**
		 * Verify the record page header: entity type and record name.
		 *
		 * Checks that the page header shows the expected entity type (e.g. Account, Lead)
		 * and record name.
		 *
		 * Examples:
```javascript
Sfdc.VerifyRecordTitle("Account", "Acme Corp");
```
		 */
	},
	_type: "boolean",
	_returns: "true if both entity type and record name match, false otherwise.",
	entityName: {
		description: "Expected entity label (e.g. Account, Lead, Opportunity).",
		type: "string",
		defaultValue: "Account"
	},
	recordName: {
		description: "Expected record name.",
		type: "string",
		defaultValue: ""
	}
};

function Sfdc_VerifyModalTitle(/**string*/ title)
{
	var xpath = "//h2[contains(@class,'slds-modal__title') or @id='modal-title']";
	var actual = "";
	var obj = null;

	SfdcAutoWait(function() {
		obj = Navigator.Find(xpath);
		if (obj)
		{
			obj.object_name = "Modal Title";
			actual = obj.GetText().trim();
			return actual === title;
		}
		return false;
	});

	if (!obj)
	{
		Tester.Assert("Modal title element is not found", false);
		return false;
	}

	Tester.AssertEqual("Verify modal title", title, actual);
	return actual === title;
}

var _paramInfoSfdc_VerifyModalTitle = {
	_: function ()
	{
		/**
		 * Verify the title of a modal dialog.
		 *
		 * Checks that the currently open modal has the expected title.
		 *
		 * Examples:
```javascript
Sfdc.VerifyModalTitle("New Lead");
```
		 */
	},
	_type: "boolean",
	_returns: "true if the modal title matches, false otherwise.",
	title: {
		description: "Expected modal title text.",
		type: "string",
		defaultValue: "New Lead"
	}
};

function Sfdc_SearchModalTable(/**string*/ value)
{
	var xpath = "//input[@role='combobox' and @aria-haspopup='true' and contains(@class,'uiInputTextForAutocomplete')]";
	var obj = Navigator.SeSFind(xpath);
	if (obj)
	{
		obj.object_name = "Search Modal Table";
		obj.DoClick();
		obj.DoSetText(value);
		Global.DoSleep(1000);
		WebDriver.Actions().SendKeys('\uE007').Perform();
		Global.DoSleep(2000);
		return true;
	}
	else
	{
		Tester.Assert("Modal table search input is not found", false);
	}
	return false;
}

var _paramInfoSfdc_SearchModalTable = {
	_: function ()
	{
		/**
		 * Search and select an item in a modal table (e.g. Add Products dialog).
		 *
		 * Types the search value into the autocomplete input inside the modal,
		 * waits for results, and presses Enter to select.
		 *
		 * Examples:
```javascript
Sfdc.SearchModalTable("AutoProduct Basic");
```
		 */
	},
	_type: "boolean",
	_returns: "true if the search was performed, false if the input was not found.",
	value: {
		description: "Text to search for in the modal table.",
		type: "string",
		defaultValue: ""
	}
};

function Sfdc_VerifyFieldInvalid(/**string*/ name)
{
	var xpath = "//*[contains(@class,'slds-form-element') and .//label[normalize-space(.)='" + name + "' or normalize-space(.)='*" + name + "']]//input[@aria-invalid='true']";
	var obj = Navigator.SeSFind(xpath);

	if (!obj)
	{
		Tester.Assert("Field '" + name + "' shows validation error", false);
		return false;
	}

	Tester.Assert("Field '" + name + "' shows validation error", true);
	return true;
}

var _paramInfoSfdc_VerifyFieldInvalid = {
	_: function ()
	{
		/**
		 * Verify that a form field is in an invalid state (has validation error).
		 *
		 * Checks that the field has `aria-invalid="true"`, indicating a validation error.
		 *
		 * Examples:
```javascript
Sfdc.VerifyFieldInvalid("Last Name");
```
		 */
	},
	_type: "boolean",
	_returns: "true if the field shows a validation error, false otherwise.",
	name: {
		description: "Label of the field to check.",
		type: "string",
		defaultValue: "Last Name"
	}
};

function Sfdc_InlineEdit(/**string*/ name)
{
	var xpath = "//button[contains(@class,'test-id__inline-edit-trigger') and @title='Edit " + name + "']";
	var obj = Navigator.SeSFind(xpath);
	if (obj)
	{
		obj.object_name = "Edit " + name;
		obj._DoEnsureVisible();
		return obj.DoClick();
	}
	else
	{
		Tester.Assert("Inline edit button for field '" + name + "' is not found", false);
	}
	return false;
}

var _paramInfoSfdc_InlineEdit = {
	_: function ()
	{
		/**
		 * Click the inline edit pencil icon for a field on a record detail page.
		 *
		 * Opens the field for inline editing by clicking its pencil icon.
		 *
		 * Examples:
```javascript
Sfdc.InlineEdit("Website");
```
		 */
	},
	_type: "boolean",
	_returns: "true if the edit button was found and clicked, false otherwise.",
	name: {
		description: "Label of the field to edit.",
		type: "string",
		defaultValue: "Website"
	}
};

function Sfdc_UploadFile(/**string*/ relatedListName, /**string*/ fileName)
{
	relatedListName = relatedListName || "Notes & Attachments";
	
	// Scroll the related list into view first
	var articleXpath = "//div[contains(@class,'active')]//article[@aria-label='" + relatedListName + "']";
	var article = Navigator.SeSFind(articleXpath);
	if (article)
	{
		article.object_name = relatedListName;
		article._DoEnsureVisible();
		Global.DoSleep(500);
	}

	// Find the file input within the related list
	// Example XPath: //div[contains(@class,'active')]//article[@aria-label='Notes & Attachments']//input[@type='file']
	var inputXpath = "//div[contains(@class,'active')]//article[@aria-label='" + relatedListName + "']//input[@type='file']";
	var fileInput = Navigator.Find(inputXpath);

	if (!fileInput)
	{
		Tester.Assert("File input not found in related list '" + relatedListName + "'", false);
		return false;
	}

	// Resolve the file path relative to the test case working directory
	var fullPath = Global.GetFullPath(fileName);
	Tester.Message("Uploading file: " + fullPath + " to '" + relatedListName + "'");
	var aw = WebDriver.autoWait;
	WebDriver.autoWait = false;
	fileInput.DoSendKeys(fullPath);
	WebDriver.autoWait = aw;
	Global.DoSleep(3000);

	// Click the "Done" button to confirm the upload
	var doneBtn = SfdcAutoWait(function() {
		return Navigator.Find("//button[normalize-space(.)='Done']");
	});

	if (!doneBtn)
	{
		Tester.Assert("'Done' button not found after file upload", false);
		return false;
	}

	doneBtn.object_name = "Done";
	doneBtn.DoClick();
	Global.DoSleep(1000);

	return true;
}

var _paramInfoSfdc_UploadFile = {
	_: function ()
	{
		/**
		 * Upload a file to a related list on the current record page.
		 *
		 * Finds the file input within the specified related list, uploads the file,
		 * and clicks the Done button to confirm.
		 *
		 * Examples:
```javascript
Sfdc.UploadFile("Notes & Attachments", "TestData\\document.pdf");
```
		 */
	},
	_type: "boolean",
	_returns: "true if the file was uploaded successfully, false otherwise.",
	relatedListName: {
		description: "Name of the related list (defaults to 'Notes & Attachments' if empty).",
		type: "string",
		defaultValue: "Notes & Attachments",
		optional: true
	},
	fileName: {
		description: "Relative path to the file to upload.",
		type: "string",
		defaultValue: ""
	}
};

function Sfdc_VerifyAttachmentExists(/**string*/ relatedListName, /**string*/ name)
{
	relatedListName = relatedListName || "Notes & Attachments";

	// Scroll the related list into view
	var articleXpath = "//div[contains(@class,'active')]//article[@aria-label='" + relatedListName + "']";
	var article = Navigator.SeSFind(articleXpath);
	if (article)
	{
		article.object_name = relatedListName;
		article._DoEnsureVisible();
		Global.DoSleep(500);
	}

	// Find the attachment item by title span
	var itemXpath = "//article[@aria-label='" + relatedListName + "']//li//span[contains(@class,'itemTitle') and normalize-space(.)='" + name + "']";
	var item = Navigator.Find(itemXpath);

	if (item)
	{
		Tester.Assert("Attachment '" + name + "' exists in '" + relatedListName + "'", true);
		return true;
	}
	else
	{
		Tester.Assert("Attachment '" + name + "' not found in '" + relatedListName + "'", false);
		return false;
	}
}

var _paramInfoSfdc_VerifyAttachmentExists = {
	_: function ()
	{
		/**
		 * Verify that an attachment with the given name exists in a related list.
		 *
		 * Searches for the attachment item by its title within the related list.
		 *
		 * Examples:
```javascript
Sfdc.VerifyAttachmentExists("Notes & Attachments", "document");
```
		 */
	},
	_type: "boolean",
	_returns: "true if the attachment is found, false otherwise.",
	relatedListName: {
		description: "Name of the related list (defaults to 'Notes & Attachments' if empty).",
		type: "string",
		defaultValue: "Notes & Attachments",
		optional: true
	},
	name: {
		description: "Expected attachment file name (without extension).",
		type: "string",
		defaultValue: ""
	}
};

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

var _paramInfoSfdc_SaveDom = {
	_: function ()
	{
		/**
		 * Save the DOM tree of the current page to files for debugging.
		 *
		 * Saves the DOM as `domR.json` (JSON format) and `dom.xml` (XML format)
		 * in the current working directory.
		 *
		 * Examples:
```javascript
Sfdc.SaveDom();
```
		 */
	},
	_type: "void",
	_returns: "Nothing."
};

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
		Navigator.SeSFind(o["Sumbit"]).DoClick();
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
