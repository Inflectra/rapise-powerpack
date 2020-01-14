//Put your custom functions and variables in this file


function SeSGetUIAutomationChildByProperty(/**object*/cp, /**string*/propName, /**string*/propValue, /**boolean*/bAll)
{
	var aRes = null;
	if(bAll) aRes = [];
	
	var chld = g_UIAutomationWrapper.GetChildAt(cp, 0);
	var ind = 1;
	while(chld)
	{
		var propVal = SeSGetUIAutomationProperty(chld, propName);
		
		if(propVal==propValue)
		{
			if(bAll)
			{
				aRes.push(chld);
			} else {
				return chld;
			}
		}
		
		chld = g_UIAutomationWrapper.GetNextSibling(chld);
	}
	return aRes;
}

function _SeSUIAutomationClick_(cp)
{
	SeSUIAutomationClick(cp);
	//Global.DoSleep(100);
}


/**
 * Set calendar value for WPF Calendar.
 * @param oid object id
 * @param year
 * @param month (1-12)
 * @param day (1-31)
 */
function WpfCalendarSetDate(/**objectid*/oid, /**number*/year, /**number*/month, /**number*/day)
{

	var strDate = year+'-'+month+'-'+day;
	Log('Setting: '+oid+" to "+strDate);

	var calInst = null;

	if(typeof(oid)=="string")
	{
		var cal = SeSFindObj(oid);
		if( cal )
		{
			calInst = cal.instance;
		}
	} else {
		calInst = oid;
		oid = 'Calendar';
	}
	
	if( !calInst ) return false;
	
	var currView = SeSGetUIAutomationProperty(calInst, "MultipleViewPatternIdentifiers.CurrentViewProperty");
		
	var hdrInst = SeSGetUIAutomationChildByProperty(calInst, "AutomationElementIdentifiers.AutomationIdProperty", "PART_HeaderButton");
	var nxtInst = SeSGetUIAutomationChildByProperty(calInst, "AutomationElementIdentifiers.AutomationIdProperty", "PART_NextButton");
	var prvInst = SeSGetUIAutomationChildByProperty(calInst, "AutomationElementIdentifiers.AutomationIdProperty", "PART_PreviousButton");
	
	if(currView!=1)
	{
		_SeSUIAutomationClick_(hdrInst);
		Global.DoSendKeys('^{DOWN}^{DOWN}^{UP}');
	}
	
	var changeYear = true;
	var gotYear = false;
	var maxIter = 150;
	while(changeYear)
	{
		var fullYear = SeSGetUIAutomationProperty(hdrInst, "AutomationElementIdentifiers.NameProperty");
		var fullYearN = parseInt(fullYear);
		
		if(l3) Log3("Got fullYear: "+fullYear+" fullYearN:"+fullYearN);
		
		if(!isNaN(fullYearN))
		{
			if(fullYearN>year)
			{
				_SeSUIAutomationClick_(prvInst);
			} else if(fullYearN<year) {
				_SeSUIAutomationClick_(nxtInst);
			} else {
				changeYear = false;
				gotYear = true;
				break;
			}
		} else {
			return false;
		}
		maxIter--;
		if(maxIter==0) return false;
	}
	
	var selMonth = 0;
	var chld = g_UIAutomationWrapper.GetChildAt(calInst, 0);
	var ind = 1;
	while(chld)
	{
		var chldClass = g_UIAutomationWrapper.GetClassName(chld);
		if( chldClass == "CalendarButton" )
		{
			if( SeSGetUIAutomationProperty(chld, "SelectionItemPatternIdentifiers.IsSelectedProperty") )
			{
				selMonth = ind;
				if(selMonth == month) break;
			} else {
				if( ind == month )
				{
					_SeSUIAutomationClick_(chld);
					selMonth = ind
					break;
				}
			}
			ind++;
		}
		chld = g_UIAutomationWrapper.GetNextSibling(chld);
	}
	
	if( selMonth!=ind ) return false;
	
	Global.DoSendKeys('^{DOWN}');
	
	
	// Now select a Day
	var chld = g_UIAutomationWrapper.GetChildAt(calInst, 0);
	var day1Found = false;
	var ind = 0;
	while(chld)
	{
		var chldClass = g_UIAutomationWrapper.GetClassName(chld);
		if( chldClass == "CalendarDayButton" )
		{
			var chldTxt = g_UIAutomationWrapper.GetChildAt(chld, 0);
			var btnCaption = SeSGetUIAutomationProperty(chldTxt, "AutomationElementIdentifiers.NameProperty");
			
			if (btnCaption == '1') {
				if(day1Found)
				{
					Log('Day not present in this month!');
					return false;
				} else {
					day1Found = true;
				}
			}
			
			if( day1Found )
			{
				if( btnCaption == ''+day )
				{
					_SeSUIAutomationClick_(chld);
					Tester.Assert(oid+': set to '+strDate, true)
					return true;
				}
			} 
			
		}
		chld = g_UIAutomationWrapper.GetNextSibling(chld);
		ind++;
	}
	
	return false;
}

/**
 * Set date value for standard WPF Date Picker with Popup Calendar.
 * @param oid object id
 * @param year
 * @param month (1-12)
 * @param day (1-31)
 */
function WpfDatePickerSetDate(/**objectid*/oid, /**number*/year, /**number*/month, /**number*/day)
{
	var picker = SeSFindObj(oid);
	var maxIter = 10;
	do
	{
		var expanded = SeSGetUIAutomationProperty(picker.instance, "ExpandCollapsePatternIdentifiers.ExpandCollapseStateProperty");
		if(!expanded)
		{
			var btnInst = SeSGetUIAutomationChildByProperty(picker.instance, "AutomationElementIdentifiers.AutomationIdProperty", "PART_Button");
			_SeSUIAutomationClick_(btnInst);
			Global.DoSleep(100);
		}
		maxIter--;
	} while(!expanded && maxIter>0)
	
	if( expanded )
	{
		
		var cal = SeSGetUIAutomationChildByProperty(picker.instance, "AutomationElementIdentifiers.ClassNameProperty", "Calendar");
		if(cal)
		{
			WpfCalendarSetDate(cal, year, month, day);
		} 
	}
	return false;
}

/**
 * Get current value for WPF Calendar.
 * @param oid object id
 */
function WpfCalendarGetSelectedDate(/**objectid*/oid)
{
	Log('Reading date from: '+oid);

	var cal = SeSFindObj(oid);
	
	var currView = SeSGetUIAutomationProperty(cal.instance, "MultipleViewPatternIdentifiers.CurrentViewProperty");
	
	if(currView!=0)
	{
		Global.DoSendKeys('^{DOWN}^{DOWN}');
	}
	
	
	// Now select a Day
	var chld = g_UIAutomationWrapper.GetChildAt(cal.instance, 0);
	while(chld)
	{
		var chldClass = g_UIAutomationWrapper.GetClassName(chld);
		if( chldClass == "CalendarDayButton" )
		{
			if( SeSGetUIAutomationProperty(chld, "SelectionItemPatternIdentifiers.IsSelectedProperty") )
			{
				var selectedDate = SeSGetUIAutomationProperty(chld, "AutomationElementIdentifiers.NameProperty");
				return selectedDate;
			}
		}
		chld = g_UIAutomationWrapper.GetNextSibling(chld);
	}
	
	return null;
}

/**
 * Set current value for WPF Date Picker with Calendar Popup.
 * @param oid object id
 */
function WpfDatePickerGetSelectedDate(/**objectid*/oid)
{
	Log('Reading date from: '+oid);

	var cal = SeSFindObj(oid);
	
	var txtBox = SeSGetUIAutomationChildByProperty(cal.instance, "AutomationElementIdentifiers.AutomationIdProperty", "PART_TextBox");

	var v = SeSGetUIAutomationProperty(txtBox, "ValuePatternIdentifiers.ValueProperty");
	
	return v;
}
