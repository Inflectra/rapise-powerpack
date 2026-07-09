
/**
 * @PageObject Sfdc object to perform common actions like launch, navigate module, etc.
 *
 * @Version 2.0.0
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
	var result;
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

/**
 * Launches Salesforce in a browser. SfdcUrl, UserName, Password must be set in Config.xlsx
 */
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
	
	Global.DoWaitFor("G_Waffle", 30000, 5000);
	
	return true;
}

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

/**
 * Opens application.
 * @param app Name of an application (e.g. Service, Marketing, Sales).
 */
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

	SeS("G_Waffle").DoClick(5,5);
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
		return obj.DoLClick();
	}
	else
	{
		Tester.Assert("Module element is not found: " + module, false);
	}
	return false;
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
		return obj.DoClick();
	}
	else
	{
		Tester.Assert("View element is not found: " + view, false);
	}
	return false;
}

/**
 * Clicks button by name
 * @param name Name of a button
 */
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

/**
 * Sets text into a form field
 * @param name Name of a field
 * @param value Text to enter
 */
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

/**
 * Sets a checkbox on a form.
 * @param name Name (label) of the checkbox field.
 * @param state Desired state of a checkbox (true to check, false to uncheck).
 */
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

/**
 * Verifies value of a Details view field
 * @param name Name of a field
 * @param value Text to verify
 */
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

/**
 * Verifies a field value displayed inside a related list card (preview card layout).
 * Locates the card by its aria-label, finds the specific item by name, then reads the field value.
 * @param cardName Name of the related list card (matches aria-label on the article element, e.g. "Products").
 * @param itemName Name of the item within the card (e.g. "AutoProduct Basic"). Used to scope the lookup when multiple items exist.
 * @param fieldName Label of the field to verify (e.g. "Sales Price", "Quantity", "Stage").
 * @param value Expected value text.
 */
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

/**
 * Searches data in a table.
 */
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

/** 
 * Selects item from a combobox.
 * Supports Lightning combobox (lightning-combobox), classic Aura picklist (forceInputPicklist),
 * and native HTML select elements (uiInputSelect).
 * @param item Item name.
 * @param name Name of a combobox.
 */
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

/** 
 * Selects item from a lookup field.
 * @param item Item name.
 * @param name Name of a lookup field.
 */
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

/** 
 * Selects inner tab.
 * @param name Tab name (e.g. Details, Activity).
 */
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

/** 
 * Sets active Path step.
 * @param name Step name (e.g. Prospecting, Qualification).
 */
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

/** 
 * Adds a report filter (a.g. "Account Name" contains "Auto").
 * @param filter Filter name (e.g. Account Name).
 * @param operator Operator to use (e.g. contains).
 * @param value Input value for the filter.
 */
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

/**
 * Computes a date relative to today (or a given base) and returns it formatted
 * for Salesforce date input fields.
 *
 * @param offsetDays Number of days to add (can be negative). Default 0.
 * @param baseDate Base date string (ISO format "yyyy-MM-dd") or "today". Default "today".
 * @returns Formatted date string ready for SetTextField.
 *
 * Usage:
 *   Sfdc.FormatDate(60);              // today + 60 days
 *   Sfdc.FormatDate(7, "today");      // today + 7 days
 *   Sfdc.FormatDate(0, "2026-01-15"); // specific date, no offset
 *   Sfdc.SetTextField("Close Date", LastResult);
 */
function Sfdc_FormatDate(/**number*/ offsetDays, /**string*/ baseDate)
{
	/** 
	 * The format is read from Config.xlsx key "DateFormat" (default: "M/d/yyyy" — US locale).
	 * Supported tokens: M, MM, d, dd, yyyy, yy.
	 */
	
	offsetDays = offsetDays || 0;
	baseDate = baseDate || "today";

	var dt;
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

/**
 * Clicks an action from a Related List's dropdown menu.
 * Locates the related list by its aria-label, opens the dropdown trigger,
 * and selects the specified menu item.
 * @param listName Name of the related list (e.g. "Contact Roles", "Products").
 * @param actionName Name of the action in the dropdown menu (e.g. "Add Contact Roles").
 */
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

/**
 * Clicks an action from a specific item's dropdown menu within a Related List.
 * @param listName Name of the related list (e.g. "Products", "Contact Roles").
 * @param itemName Name/text of the item row (e.g. "AutoProduct Basic").
 * @param actionName Name of the action in the row dropdown (e.g. "Edit", "Delete").
 */
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

/**
 * Verifies the record page header: entity type and record name.
 * @param entityName Expected entity label (e.g. "Account", "Lead", "Opportunity").
 * @param recordName Expected record name (e.g. "Acme Corp").
 */
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

/**
 * Verifies the title of a modal dialog.
 * @param title Expected modal title text (e.g. "New Lead", "New Account").
 */
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

/**
 * Searches and selects an item in a modal table (e.g. Add Products dialog).
 * Targets the autocomplete combobox input inside the modal, types the value,
 * waits for results, and selects the matching item.
 * @param value Text to search for and select.
 */
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

/**
 * Verifies that a form field is in an invalid state (has validation error).
 * @param name Field label text (e.g. "Last Name", "Company").
 */
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

/**
 * Clicks the inline edit pencil icon for a given field on a record detail page.
 * @param name Field label (e.g. "Website", "Phone", "Company").
 */
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

/**
 * Uploads a file to a related list's file input on the current record page.
 * @param relatedListName Name of the related list (e.g. "Notes & Attachments"). Defaults to "Notes & Attachments" if empty.
 * @param fileName Relative path to the file to upload (resolved via Global.GetFullPath).
 * @returns {boolean} true on success, false if the file input was not found.
 */
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

/**
 * Verifies that an attachment with the given name exists in a related list.
 * @param relatedListName Name of the related list (e.g. "Notes & Attachments").
 * @param name Expected attachment file name (without extension).
 * @returns {boolean} true if the attachment is found, false otherwise.
 */
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
