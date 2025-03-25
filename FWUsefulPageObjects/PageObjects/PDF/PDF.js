/**
 * @PageObject PDF handling: read text, check that PDF contains some text, assert PDF contains something.
 * 
 * @Version 1.0.2
 */

SeSGlobalObject("PDF")

function PDF_GetFullText(/**string*/pdfPath)
{
	global.pdfLastError = global.pdfLastError||"";
	var scriptPath = File.ResolvePath(__dirname+"\\PDF2Text\\pdfparse.js");
	pdfPath = File.ResolvePath(pdfPath);
	
	if( !File.Exists(pdfPath) )
	{
		global.pdfLastError += ""+pdfPath+" not found"+"<br/>";
		return "";
	}
	
	// Restore packages if needed
	var scriptFolder = g_helper.GetDirectoryName(scriptPath);
	if (!File.FolderExists(scriptFolder+'\\node_modules'))
	{
		var npmCmd = g_helper.ResolvePath("InstrumentJS/npm.cmd");
		g_util.Run('"' + npmCmd + '"' + " install", scriptFolder);
	}

	var fso = new ActiveXObject("Scripting.FileSystemObject");
	var tempfolder = fso.GetSpecialFolder(2);
	var tempname = fso.GetTempName();
	var tempfile = tempfolder+"\\"+tempname;
	
	// Return instrumented verison of file, ready for eval
	var cmd = g_helper.ResolvePath("InstrumentJS/node.exe");
	var cmdLine = '"'+cmd+'" "'+scriptPath+'" '+JSON.stringify(pdfPath)+' '+JSON.stringify(tempfile);

	if(l3) Log3("Pdf2Text: calling "+cmdLine);

	var wsh = new ActiveXObject("WScript.Shell");
	var testWrkDir = wsh.CurrentDirectory;
	wsh.CurrentDirectory = g_helper.GetDirectoryName(scriptPath);
	var exitCode = wsh.Run(cmdLine, 0, true);
	wsh.CurrentDirectory = testWrkDir;

	global.pdfLastError += "pdfparse.js exit code: "+exitCode+"<br/>";

	if(File.Exists(tempfile))
	{
		var result = File.Read(tempfile);
		return result;
	} else {
			global.pdfLastError += "Processing: "+pdfPath+" returned empty: "+tempfile+"<br/>";
	}
	
	return null;
}

var _paramInfoPDF_GetFullText = {
	_: function()
	{
/**
 * Parse PDF at `pdfPath` and return its text representation for further processing
 */
	},
	_type: "string",
	_returns: "Text of the PDF file.",
	pdfPath: {
		description: "Path to input PDF file.",
		binding: "path",
		ext: "arf"
	}
};

function PDF_Contains(/**string*/pdfPath, /**string*/textOrRegexp)
{
	global.pdfLastError = "";
	var txt = PDF_GetFullText(pdfPath);
	
	if(!txt) 
	{
		return "";
	}
	
	if( SeSCheckString(textOrRegexp, txt) ) 
	{
		return true;
	}
	
	return txt.indexOf(textOrRegexp)>=0;
}

var _paramInfoPDF_Contains = {
	_: function()
	{
/**
 * Parse PDF at `pdfPath` and check if it contains `textOrRegexp` value.
 */
	},
	_type: "string",
	_returns: "`true` if text present in the PDF.",
	pdfPath: {
		description: "Path to input PDF file.",
		binding: "path",
		ext: "arf"
	},
	textOrRegexp: {
		description: "Either plain string, or something starting from regex: to look in the file"
	}
};

function PDF_AssertContains(/**string*/assertionMessage, /**string*/pdfPath, /**string*/textOrRegexp)
{
	Tester.Assert(assertionMessage, PDF_Contains(pdfPath, textOrRegexp), global.pdfLastError);
}

var _paramInfoPDF_AssertContains = {
	_: function()
	{
/**
 * Parse PDF at `pdfPath` and check if it contains `textOrRegexp` value writing 
 * writing to the report as `assertionMessage`.
 */
	},
	_type: "string",
	_returns: "Text of the PDF file.",
	pdfPath: {
		description: "Path to input PDF file.",
		binding: "path",
		ext: "arf"
	},
	textOrRegexp: {
		description: "Either plain string, or something starting from regex: to look in the file"
	},
	assertionMessage: {
		description: "Line to write to the report"
	}
};

