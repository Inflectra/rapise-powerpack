var __downloadFolder = null;

/**
 * Set custom download folder.
 * @param path Download folder path.
 */
function SetDownloadFolder( /**string*/ path)
{
	__downloadFolder = path;
}

/**
 * Verify that there are files matching the spec in the downloads folder.
 * Write results to the report.
 * If nothing found before the timeout, returns empty string and add failure to the report.
 * @param [wildcardSpec=*.*] file spec. I.e. *.* or *.pdf
 * @param [timeout=30000] wait time in milliseconds.
 */
function VerifyFileDownloaded( /**string*/ wildcardSpec, /**number*/ timeout) {
	var foundFiles = WaitForFileDownloads(wildcardSpec, timeout);
	Tester.SoftAssert('VerifyFileDownloaded: ' + wildcardSpec, !!foundFiles);
	return foundFiles;
}

/**
 * Wait for any files matching the spec in the downloads folder.
 * If nothing found before the timeout, returns empty string.
 * @param [wildcardSpec=*.*] file spec. I.e. *.* or *.pdf
 * @param [timeout=30000] wait time in milliseconds.
 */
function WaitForFileDownloads( /**string*/ wildcardSpec, /**number*/ timeout) {
	timeout = timeout || 30000;
	wildcardSpec = wildcardSpec || '*.*';
	Log("WaitForFileDownloads: " + wildcardSpec);
	var _start = _SeSCurrMillis();
	do {
		var res = GetFileDownloads(wildcardSpec);
		res = Global.DoTrim(res);
	} while (!res && (_SeSCurrMillis() - _start) < timeout);
	return res;
}

/**
 * Get all files matching the spec in the downloads folder
 * If nothing found, returns empty string.
 * @param [wildcardSpec=*.*] file spec. I.e. *.* or *.pdf
 */
function GetFileDownloads( /**string*/ wildcardSpec) {
	wildcardSpec = wildcardSpec || '*.*';
	var path = __downloadFolder || '%USERPROFILE%\\Downloads\\';
	var res = File.Find(path, wildcardSpec, false,
		false, true, false);
	Log("Found: " + res);
	return res;
}
