/**
 * @PageObject PDF handling: read text, check that PDF contains some text, assert PDF contains something.
 * 
 * @Version 2.0.2
 */

SeSGlobalObject("PDF")


function _PDF_ForEachPageImage(/**string*/pdfPath, /**function(pngPath)*/cb)
{
	// Restore packages if needed
	var scriptPath = File.ResolvePath(__dirname+"/PDF2Img/pdftoimage.js");
	var scriptFolder = g_helper.GetDirectoryName(scriptPath);
	
	if (!File.FolderExists(scriptFolder+'/node_modules'))
	{
		var npmCmd = g_helper.ResolvePath("InstrumentJS/npm.cmd") || 'npm';
		g_util.Run('"' + npmCmd + '"' + " ci", scriptFolder, -1, true);
	}
	
	// Return instrumented verison of file, ready for eval
	var cmd = g_helper.ResolvePath("InstrumentJS/node.exe") || "node";
	var fso = new ActiveXObject("Scripting.FileSystemObject");
	var tempfolder = fso.GetSpecialFolder(2);

	if(l3) Log3("Pdf2Image: calling "+cmdLine);

	var ijsDir = g_helper.GetDirectoryName(scriptPath);
	
	for(var pageNo = 1;pageNo<100;pageNo++)
	{
		var tempname = fso.GetTempName()+'.png';
		var tempfile = tempfolder+"/"+tempname;
		var cmdLine = '"'+cmd+'" "'+scriptPath+'" '+JSON.stringify(pdfPath)+' '+JSON.stringify(tempfile);

		var exitCode = g_util.Run(cmdLine+' '+pageNo, ijsDir, -1, true);
		global.pdfLastError = "pdftoimage.js page no: "+pageNo;
		if (exitCode==0) {
			var res = cb(tempfile);
			if( res ) {
				continue;
			}
			return res;
		}
		
		if (exitCode==2) {
			global.pdfLastError = "pdftoimage.js page count: "+(pageNo-1);
			return true;
		}
		
		// Something went wrong
		return false;
	}
	
	// Something went wrong
	return false;
	
}

function _PDF_GetFullTextAi(/**string*/pdfPath)
{
	if (!File.Exists('AI/workflows/db0d1778-73fc-4222-869b-fd63c16ef093.json') ) {
		if( !File.FolderExists('AI/workflows') ) {
			File.CreateFolder('AI/workflows');
		}
		File.Copy(__dirname+'/AI/workflows/db0d1778-73fc-4222-869b-fd63c16ef093.json', 'AI/workflows/db0d1778-73fc-4222-869b-fd63c16ef093.json');
	}

	var full_contents = "";
	_PDF_ForEachPageImage(pdfPath, function(/**string*/pngPath) {
		var iw = new ActiveXObject("SeSWrappers.Utils.ImageWrapper");
		iw.Load(pngPath);
		var page_contents = AiTester.DoImageQuery('Page text:', iw, 'ocrextract');
		full_contents += page_contents + "\n";
		return true;
	});
	
	return full_contents;
}

function _PDF_GetFullTextOcr(/**string*/pdfPath)
{
	var full_contents = "";
	_PDF_ForEachPageImage(pdfPath, function(/**string*/pngPath) {
		var page_contents = Ocr.DoExtractFromImage(pngPath);
		full_contents += page_contents + "\n";
		return true;
	});
	
	return full_contents;
}

function PDF_SetPerferredMethod(/**string*/method)
{
	var res = PDF.preferredMethod;
	PDF.preferredMethod = method||'text';
	return res;
}

var _paramInfoPDF_SetPerferredMethod = {
	_: function()
	{
/**
 * Set default PDF text extraction method (default is 'text').
 * text - assumes PDF has explicit text layer
 * ai - use AI as OCR engine (AiTester / inflectra.ai required)
 * ocr - use built in OCR engine (windows only)
 */
	},
	_type: "string",
	_returns: "Previous method.",
	method: {
		description: "Method id (text|ai|ocr).",
		type: "string",
		binding: "enum",
		defaultValue: "text",
		enumOpts: [
			["text"],
			["ai"],
			["ocr"]
		]
	}
};


function PDF_GetFullText(/**string*/pdfPath, /**string*/method)
{
	method = method || PDF.preferredMethod || "text"; // text|ocr|ai
	global.pdfLastError = global.pdfLastError||"";
	pdfPath = File.ResolvePath(pdfPath);
	
	if( !File.Exists(pdfPath) )
	{
		global.pdfLastError += ""+pdfPath+" not found"+"<br/>";
		return "";
	}
	
	if ( method=="ai" ) {
		return _PDF_GetFullTextAi(/**string*/pdfPath, /**string*/method);
	}

	if ( method=="ocr" ) {
		return _PDF_GetFullTextOcr(/**string*/pdfPath, /**string*/method);
	}
	
	// Restore packages if needed
	var scriptPath = File.ResolvePath(__dirname+"/PDF2Text/pdfparse.js");
	var scriptFolder = g_helper.GetDirectoryName(scriptPath);
	if (!File.FolderExists(scriptFolder+'/node_modules'))
	{
		var npmCmd = g_helper.ResolvePath("InstrumentJS/npm.cmd") || 'npm';
		g_util.Run('"' + npmCmd + '"' + " ci", scriptFolder, -1, true);
	}

	var fso = new ActiveXObject("Scripting.FileSystemObject");
	var tempfolder = fso.GetSpecialFolder(2);
	var tempname = fso.GetTempName();
	var tempfile = tempfolder+"/"+tempname;
	
	// Return instrumented verison of file, ready for eval
	var cmd = g_helper.ResolvePath("InstrumentJS/node.exe") || "node";
	var cmdLine = '"'+cmd+'" "'+scriptPath+'" '+JSON.stringify(pdfPath)+' '+JSON.stringify(tempfile);

	if(l3) Log3("Pdf2Text: calling "+cmdLine);

	var ijsDir = g_helper.GetDirectoryName(scriptPath);
	var exitCode = g_util.Run(cmdLine, ijsDir, -1, true);

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
		ext: "pdf"
	},
	method: {
		description: "Extraction method to use (text|ocr|ai)",
		type: "string",
		optional: true,
		defaultValue: ""
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
		ext: "pdf"
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

