
function GetAppiumNonProfileCapabilities(profile)
{
	var caps = {};
	
	// set capabilities based on a profile name
	if (profile == "BrowserStack Android App")
	{
		caps["bstack:options"] = 
		{
			userName: Global.GetProperty("BrowserStackUser", "", "Config.json"),
			accessKey: Global.GetProperty("BrowserStackKey", "", "Config.json"),
			osVersion: "14.0",
			deviceName: "Google Pixel 8",
			realMobile: true,
			enableCameraImageInjection: true
		};
	}
	
	return caps;
}
