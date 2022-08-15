
/**
 *	DoDragDrop - drag from `dragFrom` element to `dropTo`. Function supports both
 *	'HTML' and 'Selenium' browser target libraries.
 *		`dragFrom` - either Object ID or object itself for a draggable item
 *		`dropTo` - either Object ID or object itself for a drop target
 *		`dontScroll` - optional, disable scroll to `dropTo` element.
 */
function DoDragDrop(/**objectid|string*/dragFrom, /**objectid|string*/dropTo, /**boolean*/dontScroll) {
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
		WebDriver.Actions().DragAndDrop(f.element, t.element).Perform();
	} else {
		f._DoMouseMove();
		f._DoLButtonDown();
		Global.DoSleep(300);
		t._DoMouseMove();
		Global.DoSleep(300);
		t._DoLButtonUp();
	}
}
