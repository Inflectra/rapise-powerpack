


function Test(params)
{
	/**
	 * @fileOverview
	 * Enters credentials into Windows Security prompt. Supports IE and RunAs.
	 * Params object is { userName: "user", password: "pwd", type: "IE or RunAs", remember: true }
	 */

	var userName = "user";
	var password = "pwd";
	var remember = false;
	var type = "IE";
	
	if (params)
	{
		userName = params.userName;
		password = params.password;
		type = params.type || "RunAs";
		remember = params.remember || false;
	}
	
	if (type.toLowerCase() == "ie")
	{
		WindowsSecurityPromptIE(userName, password, remember);
	}
	else
	{
		WindowsSecurityPromptRunAs(userName, password);
	}
}

g_load_libraries=["Generic"];


