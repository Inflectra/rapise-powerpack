function Test(params)
{
	Global.DoLaunch('%WORKDIR%/AUT/DatePickerDemo.exe', null, true, 'DatePicker Demo');
	RVL.DoPlayScript('%WORKDIR%/Main.rvl.xlsx','RVL');
	
	return;
	
	// Similar test in JavaScript
	Tester.Message('Date Before: '+WpfCalendarGetSelectedDate('Calendar'));
	WpfCalendarSetDate('Calendar', 1960, 5, 15);
	Tester.Message('Date after: '+WpfCalendarGetSelectedDate('Calendar'));
	Tester.Assert("Year 1960", WpfCalendarGetSelectedDate('Calendar').indexOf("1960")>0)

	Tester.Message('Date Before2: '+WpfDatePickerGetSelectedDate('DatePicker'));
	WpfDatePickerSetDate('DatePicker', 1975, 3, 12);
	Tester.Message('Date After2: '+WpfDatePickerGetSelectedDate('DatePicker'));
	Tester.Assert("Year 1975", WpfDatePickerGetSelectedDate('DatePicker').indexOf("1975")>0)

	Tester.Message('Date Before3: '+WpfCalendarGetSelectedDate('Calendar'));
	WpfCalendarSetDate('Calendar', 1995, 11, 17);
	Tester.Message('Date after3: '+WpfCalendarGetSelectedDate('Calendar'));
	Tester.Assert("Year 1995", WpfCalendarGetSelectedDate('Calendar').indexOf("1995")>0)

	Tester.Message('Date Before4: '+WpfDatePickerGetSelectedDate('DatePicker'));
	WpfDatePickerSetDate('DatePicker', 1980, 1, 31);
	Tester.Message('Date Before4: '+WpfDatePickerGetSelectedDate('DatePicker'));
	Tester.Assert("Year 1980", WpfDatePickerGetSelectedDate('DatePicker').indexOf("1980")>0)
}

g_load_libraries=["UIAutomation"];


