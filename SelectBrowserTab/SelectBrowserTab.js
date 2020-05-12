//Put your custom functions and variables in this file


/**
 * Switch to a browser tab with URL containing specific URL or part of URL
 * and Attach to it.
 */
function SelectBrowserTab(/**string*/partOfUrl)
{
	var iter = 10;
	while(iter>0)
	{
		var url = Navigator.GetUrl();
		Log("Url: "+url);
		if(url.indexOf(partOfUrl)>=0)
		{
			// Attach to current tab
			Tester.Assert('Attaching to Tab: '+url, true);
			return true;
		}
		Global.DoSendKeys("^{TAB}");
		Global.DoSleep(500);
		Navigator.Detach();
		Navigator.Open();
		iter--;
	}
	Tester.Assert('Unable to find browser tab: '+partOfUrl, false);
	return false;
}