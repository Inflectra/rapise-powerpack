//Put your custom functions and variables in this file

function WindowsSecurityPromptIE(/**string*/ userName, /**string*/ password, /**boolean*/ remember)
{
	var ci = g_commandInterval;
	g_commandInterval = 50;
	remember = remember || false;
	
	SeS('Windows_Security').DoLClick(10, 10);
	if (Global.DoWaitFor('User_name', 1) == false)
	{
		SeS('More_choices').DoLClick(20, 15);
		SeS('Use_a_different_account').DoLClick(20, 15);
	}
	SeS('User_name').DoLClick(20, 20);
	SeS('User_name').DoSendKeys(userName);
	SeS('Password').DoLClick(20, 20);
	SeS('Password').DoSendKeys(password);
	var rmc = SeS('Remember_my_credentials');
	if ((remember && rmc.instance.DefaultAction == "Check") || (!remember && rmc.instance.DefaultAction == "Uncheck"))
	{
		SeS('Remember_my_credentials').DoAction();
	}
	SeS('OK').DoAction();
	g_commandInterval = ci;
}

function WindowsSecurityPromptRunAs(/**string*/ userName, /**string*/ password)
{
	var wnd = g_util.FindWindow("regex:.*", "Credential Dialog Xaml Host");
	if (wnd)
	{
		wnd.SetFocus();
		Global.DoSendKeys(userName);
		Global.DoSendKeys("{TAB}");
		Global.DoSendKeys(password);
		Global.DoSendKeys("{TAB}");
		Global.DoSendKeys("{ENTER}");
	}
}
