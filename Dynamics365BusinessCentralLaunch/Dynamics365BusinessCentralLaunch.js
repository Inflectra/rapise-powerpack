

//########## Script Steps ##############

function Test(params)
{
	var url = "https://businesscentral.dynamics.com";
	var user = "noname";
	var pwd = "pwd";
	var staySignedIn = false;

	if (params)
	{
		url = params.url;
		user = params.user;
		pwd = params.pwd;
		if (params.sraySignedIn)
		{
			staySignedIn = true;
		}
	}

	Navigator.Open(url);

	if (Global.DoWaitFor("Use_another_account", 2000))
	{
		SeS("Use_another_account").DoClick();	
	}
	
	if (Global.DoWaitFor("loginfmt", 2000))
	{
		SeS("loginfmt").DoClick();
		SeS("loginfmt").DoSetText(user);
		SeS("SubmitButton").DoClick();
		SeS("passwd").DoClick();
		SeS("passwd").DoSetText(pwd);
		SeS("SubmitButton").DoClick();
		if (Global.DoWaitFor("DontShowAgain", 5000))
		{
			if (staySignedIn)
			{
				SeS("SubmitButton").DoClick();
			}
			else
			{
				SeS("idBtn_Back").DoClick();
			}
		}
	}
	
	var obj = Global.DoWaitFor("Business_Central", 30000);

	if (obj != false)
	{
		Tester.Message("Business Central is running");
	}
	else
	{
		Tester.Assert("Business Central started", false);
	}

}

g_load_libraries=["%g_browserLibrary:Firefox HTML%", "DomDynamicsNAV"];


