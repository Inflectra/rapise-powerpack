
/**
 * @PageObject WebPageHelper is designed to help doing various actions and checks
 * with the currently open web page without need to use XPath or objects. The
 * methods of WebPageHelper are in general slower than those having exact XPath, 
 * but it is useful for writing sanity checks and quick validation scenarios.
 * The power of those methods are that they are cross-frame and are inteded to 
 * cover the whole visible contents of the page, rather than only the root frame.
 *
 * @Version 1.0.6
 */
SeSPageObject("WebPageHelper");

/**
 * Returns string containing all visible text on the current page.
 * Example:
 * 	var page = WebPageHelper.GetFullPageText();
 * 	Tester.AssertContains('Welcome message found on the page', page, 'Welcome, Friend!')
 */
function WebPageHelper_GetFullPageText()
{
	var body = Navigator.DOMFindByXPath('//body');
	if( body ) {
		var text = body.GetText();
		return text;
	}
	return "No BODY element found";
}

/**
 * Check that page contains given `textToFind`. This action does not write to the report
 * and simply returns `true` when text was found and `false` otherwise. You may pass the result
 * to the assertion or if statement.
 * Example:
 * 	if( WebPageHelper.CheckPageContains('Welcome, Friend!') ) {
 			// Already logged in, need to log out first.
 * 	}
 */
function WebPageHelper_CheckPageContains(/**string*/textToFind)
{
	var pageText = WebPageHelper.GetFullPageText();
	return Text.Contains(pageText, textToFind);
}

/**
 * Check that page contains given `textToFind` and write Pass or Fail to the report
 * accordingly
 * Example:
 * 	WebPageHelper.VerifyPageContains('Page must have welcome message', 'Welcome, Friend!');
 */
function WebPageHelper_VerifyPageContains(/**string*/message, /**string*/textToFind)
{
	Tester.SoftAssert(message, WebPageHelper_CheckPageContains(textToFind), [textToFind]);
}

function _ClickByText(text)
{
	var el = Navigator.DOMFindByText(text);
	if( el ) {
		el.DoClick();
		return true;
	}
	return false;
}

/**
 * Find an element by text and click on it. Take into account only element text.
 */
function WebPageHelper_DoClickByText(/**string*/text)
{
	if( _ClickByText(text) ) 
	{
		return true;
	}
	
	Tester.SoftAssert('Unable to find element by text: '+text, false);
	return false;
}

function _ClickByAttr(attr, value)
{
	var el = Navigator.DOMFindByAttributeValue(attr, value)
	if( el ) {
		el.DoClick();
		return true;
	}
	return false;
}

/**
 * Find an element by placeholder and click on it.
 */
function WebPageHelper_DoClickByPlaceholder(/**string*/placeholderText)
{
	if( _ClickByAttr("@placeholder", placeholderText) ) 
	{
		return true;
	}
	
	Tester.SoftAssert('Unable to find element by placeholder text: '+placeholderText, false);
	return false;
}

/**
 * Find an element by value attribute and click on it.
 */
function WebPageHelper_DoClickByValue(/**string*/value)
{
	if( _ClickByAttr("@value", value) ) 
	{
		return true;
	}
	
	Tester.SoftAssert('Unable to find element by value text: '+value, false);
	return false;
}

/**
 * Find an element by title attribute and click on it. Title is usually visible as
 * an element's tooltip.
 */
function WebPageHelper_DoClickByTitle(/**string*/title)
{
	if( _ClickByAttr("@title", title) ) 
	{
		return true;
	}
	
	Tester.SoftAssert('Unable to find element by title: '+title, false);
	return false;
}

/**
 * Find an element by name attribute and click on it. The name is usually invisible
 * so you need to know it in advance.
 */
function WebPageHelper_DoClickByName(/**string*/name)
{
	var el = Navigator.DOMFindByName(name)
	if( el ) {
		el.DoClick();
		return true;
	}
	Tester.SoftAssert('Unable to find element by name: '+name, false);
	return false;
}

/**
 * Find an element by CSS class name and click on it.
 */
function WebPageHelper_DoClickByClassName(/**string*/className)
{
	var el = Navigator.DOMFindByXPath("css=."+className)
	if( el ) {
		el.DoClick();
		return true;
	}
	
	Tester.SoftAssert('Unable to find element by class: '+className, false);
	return false;
}

/**
 * Find an element by ID.
 */
function WebPageHelper_DoClickById(/**string*/id)
{
	var el = Navigator.DOMFindByXPath("css=#"+id)
	if( el ) {
		el.DoClick();
		return true;
	}
	
	Tester.SoftAssert('Unable to find element by Id: '+id, false);
	return false;
}

/**
 * Find an element text, title or placeholder and click on it.
 * 
 * This is the most generic method for finding something on the page by visible
 * text and clicking on it. It covers buttons, links and various controls that
 * include title (title is usually shown as a tooltip), placeholder or hint.
 *
 * Example 1:
 *   WebPageHelper.DoClickByTextTitlePlaceholder('Enter username...'); // This should capture a placeholder
 * Example 2:
 *   WebPageHelper.DoClickByTextTitlePlaceholder('Login'); // This should capture a button
 * Example 3:
 *   WebPageHelper.DoClickByTextTitlePlaceholder('Press to log into the system'); // This should capture a tooltip
 */
function WebPageHelper_DoClickByTextTitlePlaceholder(/**string*/text)
{
	if( _ClickByText(text)
		|| _ClickByAttr("@title", text)
		|| _ClickByAttr("@placeholder", text)
	)
	{
		return true;
	}
	
	Tester.SoftAssert('Unable to find any element: '+text, false);
	return false;
}


/**
 * Uploads a file using drag-and-drop to a specified browser element.  
 *  
 * This function allows you to programmatically simulate a file drag-and-drop  
 * action onto a specified target element in the browser. It creates a hidden  
 * file input element to handle the file upload process and dispatches  
 * events that simulate the drag-and-drop behavior.  
 *  
 * @param {string|objectid} elOrXPath - The target element to receive the file.  
 *                                      This can be an object reference or an XPath  
 *                                      selector string. Typically a `label` or `div`  
 *                                      element where the file may be dropped.  
 * @param {string} filePath - The path to the local file to upload. This can be an  
 *                            absolute path or a relative path with respect to a  
 *                            framework directory.  
 *   
 * @returns {boolean} Returns true if the upload was successful; otherwise, it   
 *                   returns false.  
 *  
 * @example  
 * ```javascript
 * var success = WebPageHelper.DoFileDragAndDrop('//input[type="file"]', '/path/to/file.txt');
 * Tester.SoftAssert("File uploaded.", success, '/path/to/file.txt');
 * ```
 */
function WebPageHelper_DoFileDragAndDrop(/**string|objectid*/elOrXPath, /**string*/filePath)
{
	var el = elOrXPath;
	if( !el ) {
		el = "//input[@type='file']";
	}
	if(typeof el =='string' || (!el.el && el.xpath) ) {
		el = Navigator.SeSFind(elOrXPath)
	}
	if( !el ) {
		Tester.SoftAssert('FileDragAndDropUpload: element not found'+elOrXPath, false);
		return false;
	}
	var rPath = File.ResolvePath(filePath);
	var offsetX = 10;
	var offsetY = 10;
	function _doDragDrop(target, offsetX, offsetY) {
		var document = target.ownerDocument || document;
		var window = document.defaultView || window;
		
		var input = document.createElement('INPUT');
		input.type = 'file';
		input.style.display = 'none';
		input.onchange = function () {
			var rect = target.getBoundingClientRect(),
					x = rect.left + (offsetX || (rect.width >> 1)),
					y = rect.top + (offsetY || (rect.height >> 1)),
					dataTransfer = { files: this.files };
		
			['dragenter', 'dragover', 'drop'].forEach(function (name) {
				var evt = document.createEvent('MouseEvent');
				evt.initMouseEvent(name, !0, !0, window, 0, 0, 0, x, y, !1, !1, !1, !1, 0, null);
				evt.dataTransfer = dataTransfer;
				target.dispatchEvent(evt);
			});
		
			setTimeout(function () { document.body.removeChild(input); }, 25);
		};
		document.body.appendChild(input);
		return input;
	}
	
	var fakeElement = /**WebElementWrapper*/WebDriver.ExecuteScript(_doDragDrop+" return _doDragDrop(arguments[0], arguments[1], arguments[2]);", [el.element.e, offsetX, offsetY]);
	fakeElement.SendKeys(rPath);
	return true;
}

var _paramInfoWebPageHelper_DoFileDragAndDrop = {
		elOrXPath: {
				type: 'string|objectid',
				description: 'The target element to receive the file. This can be an object reference or an XPath selector string. Typically a `label` or `div` element where the file may be dropped.'
		},
		filePath: {
				type: 'string',
				description: 'The path to the local file to upload. This can be an absolute path or a relative path with respect to a framework directory.'
		},
		_returns: '\'true\' if the upload was successful; otherwise, it returns false.'
};

/**
 * Do triple-click on the element. May be useful to select the whole sencence or
 * paragraph or input contents for further Copy+Paste.
 *  
 * @param {string|objectid} elOrXPath - The target element to click.  
 *                                      This can be an object reference or an XPath  
 *                                      selector string.
 *
 * @returns {boolean} Returns true triple click .  
 *  
 * @example  
 * ```javascript
 * // Select the whole header
 * WebPageHelper.DoTripleClick('//h1');
 * ```
 */
function WebPageHelper_DoTripleClick(/**string|objectid*/elOrXPath, /**number*/offsetX, /**number*/offsetY)
{
	var el = elOrXPath;
	if(typeof el =='string' || (!el.el && el.xpath) ) {
		el = Navigator.SeSFind(elOrXPath)
	}
	if( !el ) {
		Tester.SoftAssert('WebPageHelper.DoTripleClick: element not found'+elOrXPath, false);
		return false;
	}
	
	WebDriver.Actions().Click(el.element).Click(el.element).Click(el.element).Perform();

	//var res = /**WebElementWrapper*/WebDriver.ExecuteScript(_doTripleClick+" return _doTripleClick(arguments[0], arguments[1], arguments[2]);", [el.element.e, offsetX, offsetY]);
	return true;
}

var _paramInfoWebPageHelper_DoTripleClick = {
		elOrXPath: {
				type: 'string|objectid',
				description: 'The target element to click. This can be an object reference or an XPath selector string.'
		},
		_returns: '\'true\' if the upload was successful; otherwise, it returns false.'
};
