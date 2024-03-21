
/**
 * @PageObject ImageHelper description
 */
SeSPageObject("ImageHelper");

/**
 * Injects and image into BrowserStack to use in Camera application.
 * @param {String} fileName Name of the file to inject
 */
function ImageHelper_DoInjectImage(/**string*/ fileName)
{
	/*
		curl -u "YOUR_USERNAME:YOUR_ACCESS_KEY" \
		-X POST "https://api-cloud.browserstack.com/app-automate/upload-media" \
		-F "file=@/path/to/media/file/<your_image>.png" \
		-F "custom_id=SampleMedia"
		
		{"media_url":"media://02b3466cd0b5b4825d925eb1c69f7d901890b136","custom_id":"SampleMedia","shareable_id":"<username>/SampleMedia"}

	*/
	
	var filePath = Global.GetFullPath(fileName);
	var outputPath = Global.GetFullPath("image_upload_result.json");

	var userName = Global.GetProperty("BrowserStackUser", "", "Config.json");
	var accessKey = Global.GetProperty("BrowserStackKey", "", "Config.json");

	var cmdLine = 'curl -u "' + userName + ':' + accessKey + '" ';
	cmdLine += '-X POST "https://api-cloud.browserstack.com/app-automate/upload-media" ';
	cmdLine += '-F "file=@' + filePath + '" ';
	cmdLine += '-F "custom_id=SampleMedia" ';
	cmdLine += '-o "' + outputPath + '"';
	
	Log(cmdLine);

	if (File.Exists(outputPath))
	{
		File.Delete(outputPath);
	}
	
	Global.DoCmd(cmdLine, ".", true, false);

	if (!File.Exists(outputPath))
	{
		return false;
	}

	var response = JSON.parse(File.Read(outputPath));
	var mediaUrl = response["media_url"];
	
	AppiumDriver.ExecuteScript('browserstack_executor: {"action":"cameraImageInjection", "arguments": { "imageUrl" : "' + mediaUrl + '"}}');

	return true;
}


