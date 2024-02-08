
/**
 * @PageObject ManagedHelper handy methods for popup dialogs and context menus.
 * - Work with popup dialogs (wait for appearance)
 * - Click context menu
 * - Return context menu items as list
 */

/**
 * Find and press a button in a modal dialog
 * @param {string} buttonCaption - button caption, i.e. 'OK', 'Cancel' etc.
 * @param {string} dialogCaption - dialog title
 */
function ManagedHelper_PressModalButton(/**string*/buttonCaption, /**string*/dialogCaption) {
	buttonCaption = buttonCaption || "Close";
	
	var cp = this.__FindModalDialog(dialogCaption);
	if(cp) {
		var res = SeSManagedFindByNameFastImpl( buttonCaption, cp, 3);
		if( !res ) {
			res = SeSManagedFindByTextImpl( buttonCaption, cp, 3);
		}
		if(res) {
			var btn = SeSTryMatch(res);
			if( btn ) {
				btn.DoClick();
				return true;
			}
			return false;
		}
	} else {
		Tester.SoftAssert('ManagedHelper_DoPressModalButton: dialog not found '+dialogCaption, false);
	}
}

/**
 * Find modal Managed dialog with given title within process with given `pid`.
 * @param {string} dialogCaption - caption to look for
 * @param {number} pid - optional PID of the application
 */
function ManagedHelper_FindModalDialog(/**string*/dialogCaption, /**number*/pid)
{
	SeSLoadLibrary("Managed");

	dialogCaption = dialogCaption || "regex:.*";
	var arry = g_util.FindWindows('regex:.*', 'regex:#32768|WindowsForms10.Window.*');
	if(l3) Log3("FindModalDialog: Found "+arry.length+" managed windows");
	for(var i=0;i<arry.length;i++) {
		var wnd = /**HWNDWrapper*/arry[i];
		if( pid && pid != wnd.PID) {
			if(l3) Log3("Other PID: "+wnd.PID);
			continue;
		}
		if(l3) Log3("Getting managed for wind "+wnd);
		var cp = SeSGetManaged(wnd);
		if(l3) Log3("Checking Visible");
		var wv = wnd.Visible;
		if(cp&&wv) {
			var x = wnd.PosX;
			var y = wnd.PosY;
			var w = wnd.PosWidth;
			var h = wnd.PosHeight;
			if(x>=0 && y>=0 && (w*h)>0 ) {
				
				var isVisible = SeSManagedInvokeExpr2(cp, "Visible", true);
				if (isVisible) {
					var txt = SeSGetManagedText(cp);
					if(l3) Log3("Window "+i+" text: "+txt);
					console.log("x", x, "y", y, "w", w, "h", h, "wv", wv, "isVisible", isVisible);
					
					if( SeSCheckString(dialogCaption, txt) ) {
						// Got a popup window.
						return cp;
					}
				}
			}
		}
	}
	return null;
}

/**
 * Click menu item in the context menu by given `path`. When `path` is not set,
 * return full contents of the context menu as list
 */
function ManagedHelper_ContextMenuSelect(/**string*/path)
{
	var mnu = /**ManagedMenuPopupItem*/ManagedHelper._GetContextMenuObject();
	if(mnu) {
		if(path) {
			return mnu._DoMenu(path);
		} else {
			return mnu._DoFullText();
		}
	} else {
		Tester.SoftAssert('Context menu not available', false, path);
		return false;
	}
}

/**
 * Return ManagedObject representing currently visible context menu
 */
function ManagedHelper_GetContextMenuObject()/**ManagedMenuItem*/
{
	for(var attempt = 0;attempt<5;attempt++) {
		var found = _GetContextMenuObject();
		if( found ) return found;
		Global.DoSleep(300);
	}
	return null;
}

function _GetContextMenuObject()/**ManagedMenuItem*/
{
	SeSLoadLibrary("UIAutomation");

	var arry = g_util.FindWindows('', 'regex:#32768|WindowsForms10.Window.*');
	if(l3) Log3("GetContextMenuObject: Found "+arry.length+" managed windows");
	for(var i=0;i<arry.length;i++) {
		var wnd = arry[i];
		if(l3) Log3("Checking window: "+wnd);
		var cp = SeSGetManaged(wnd);
		var wv = wnd.Visible;
		if(l3) Log3("Window Visible: "+wv);
		if(cp&&wv) {
			
			var str= g_managedWrapper.GetClassHierarchy(cp);
			if( str.indexOf( "System.Windows.Forms.ToolStripDropDown" )<0 ) {
				// It is not a context menu
				continue;
			}
			
			if(l3) Log3("Window Visible: "+wv);
			var res = SeSTryMatch(cp, SeSRule("ManagedMenuPopupItem"));
			if(res && res.GetVisible()) return res;
		}
	}

	return null;
}

/**
 * Check for managed popup window with given `caption` to show up on the screen.
 * Limit check with `timeout`.
 */
function ManagedHelper_WaitForPopup(/**string*/caption, /**number*/timeout) {
	timeout = timeout || 10000;
	var _start = _SeSCurrMillis();
	do
	{
		var res = ManagedHelper.__FindModalDialog(caption);
		if(res) return res;
	} while(_SeSCurrMillis() - _start < timeout);
	
	return false;
}

SeSPageObject("ManagedHelper");
