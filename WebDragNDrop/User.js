
/**
 *	DoDragDrop - drag from `dragFrom` element to `dropTo`. Function supports both
 *	'HTML' and 'Selenium' browser target libraries.
 *		`dragFrom` - either Object ID or object itself for a draggable item
 *		`dropTo` - either Object ID or object itself for a drop target
 *		`dontScroll` - optional, disable scroll to `dropTo` element.
 *		`doNative` - optional. Force native drag&drop (for the case when selenium fails)
 */
function DoDragDrop(/**objectid|string*/dragFrom, /**objectid|string*/dropTo, /**boolean*/dontScroll, /**boolean*/doNative) {
	var /*HTMLObject*/f = dragFrom;
	if(typeof(dragFrom)=='string') f = SeS(dragFrom);
	var /*HTMLObject*/t = dropTo;
	if(typeof(dropTo)=='string') t = SeS(dropTo);
	
	if(f&&t)
	{
		if(!dontScroll) 
		{
			f._DoEnsureVisible();
			t._DoEnsureVisible();
		}
	}
	
	if(typeof(WebDriver)!='undefined') 
	{
		if(doNative)
		{
			Navigator.FindDomElementAtCursor();
			var contentWnd = Navigator.GetBrowserHWND();
			var browserRect = {x: contentWnd.PosX, y: contentWnd.PosY, w: contentWnd.PosWidth, h: contentWnd.PosHeight}
			WebDriver.ExecuteScript("document.rapise.setRootRect(" + JSON.stringify(browserRect) + ")");
			
			var rectf = WebDriver.ExecuteScript("return document.rapise.getElementRect(arguments[0]);", f.element.e);
			var rectt = WebDriver.ExecuteScript("return document.rapise.getElementRect(arguments[0]);", t.element.e);
			
			Global.DoMouseMove(rectf.x+(rectf.w>>1), rectf.y+(rectf.h>>1), 500);
			Global.DoSleep(500);
			g_util.LButtonDown();
			Global.DoMouseMove(rectt.x+(rectt.w>>1), rectt.y+(rectt.h>>1), 500);
			Global.DoSleep(500);
			g_util.LButtonUp();
		} else {
			WebDriver.Actions().DragAndDrop(f.element, t.element).Perform();
		}
	} else {
		f._DoMouseMove();
		f._DoLButtonDown();
		Global.DoSleep(300);
		t._DoMouseMove();
		Global.DoSleep(300);
		t._DoLButtonUp();
	}
}
