//Put your custom functions and variables in this file

/**
 * Drops file from file system to a drop area on a page.
 * @param fileName Full path to the file.
 * @param dropElement Object Id of a drop element.
 */
function DropFileHere(/**string*/ fileName, /**objectId*/ dropElement)
{
	var JS_DROP_FILE =
		"var target = arguments[0]," +
		"    offsetX = arguments[1]," +
		"    offsetY = arguments[2]," +
		"    document = target.ownerDocument || document," +
		"    window = document.defaultView || window;" +
		"" +
		"var input = document.createElement('INPUT');" +
		"input.type = 'file';" +
		"input.style.display = 'none';" +
		"input.onchange = function () {" +
		"  var rect = target.getBoundingClientRect()," +
		"      x = rect.left + (offsetX || (rect.width >> 1))," +
		"      y = rect.top + (offsetY || (rect.height >> 1))," +
		"      dataTransfer = { files: this.files };" +
		"" +
		"  ['dragenter', 'dragover', 'drop'].forEach(function (name) {" +
		"    var evt = document.createEvent('MouseEvent');" +
		"    evt.initMouseEvent(name, !0, !0, window, 0, 0, 0, x, y, !1, !1, !1, !1, 0, null);" +
		"    evt.dataTransfer = dataTransfer;" +
		"    target.dispatchEvent(evt);" +
		"  });" +
		"" +
		"  setTimeout(function () { document.body.removeChild(input); }, 25);" +
		"};" +
		"document.body.appendChild(input);" +
		"return input;";

	try
	{
		var obj = SeS(dropElement);
		var input = WebDriver.ExecuteScript(JS_DROP_FILE, [obj.element.e, 25, 25]);
		input.SendKeys(fileName);
	}
	catch(e)
	{
		Tester.Message('Problem with file upload: ' + e.message);
		return false;
	}

	// Wait for input to disappear after file upload
	var count = 60;
	while(true)
	{
		try
		{
			input.GetEnabled();
			Global.DoSleep(1000);
			count--;
			if (count == 0)
			{
				Tester.Message('File upload timeout of ' + count + ' seconds');
				break;
			}
		}
		catch(e)
		{
			return true;
		}
	}
	
	return false;
}

