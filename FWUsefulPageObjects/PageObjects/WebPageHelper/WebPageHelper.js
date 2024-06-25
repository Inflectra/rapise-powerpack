
/**
 * @PageObject WebPageHelper is designed to help doing various actions and checks
 * with the currently open web page without need to use XPath or objects. The
 * methods of WebPageHelper are in general slower than those having exact XPath, 
 * but it is useful for writing sanity checks and quick validation scenarios.
 * The power of those methods are that they are cross-frame and are inteded to 
 * cover the whole visible contents of the page, rather than only the root frame.
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
function WebPageHelper_DoClickByValue(/**string*/text)
{
	if( _ClickByAttr("@value", text) ) 
	{
		return true;
	}
	
	Tester.SoftAssert('Unable to find element by value text: '+text, false);
	return false;
}

/**
 * Find an element by title attribute and click on it.
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
function WebPageHelper_DoClickByName(/**string*/text)
{
	var el = Navigator.DOMFindByName(text)
	if( el ) {
		el.DoClick();
		return true;
	}
	Tester.SoftAssert('Unable to find element by name: '+text, false);
	return false;
}

/**
 * Find an element by CSS class name and click on it.
 */
function WebPageHelper_DoClickByClassName(/**string*/text)
{
	var el = Navigator.DOMFindByXPath("css=."+text)
	if( el ) {
		el.DoClick();
		return true;
	}
	
	Tester.SoftAssert('Unable to find element by class: '+text, false);
	return false;
}

/**
 * Find an element by ID.
 */
function WebPageHelper_DoClickById(/**string*/text)
{
	var el = Navigator.DOMFindByXPath("css=#"+text)
	if( el ) {
		el.DoClick();
		return true;
	}
	
	Tester.SoftAssert('Unable to find element by Id: '+text, false);
	return false;
}

/**
 * Find an element text, title or placeholder and click on it.
 * 
 * This is the most generic method for finding something on the page by visible
 * text and clicking on it. It covers buttons, links and various controls that
 * include title, placeholder or hint.
 *
 * Example 1:
 *   WebPageHelper.DoClickByTextTitlePlaceholder('Enter username...'); // This should capture a placeholder
 * Example 2:
 *   WebPageHelper.DoClickByTextTitlePlaceholder('Login'); // This should capture a button
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

