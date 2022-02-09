//Put your custom functions and variables in this file

/**
 *	ComparePageToWordFile
 *	Read current page context and compare to contents of MSWord file. Results are written
 *	refWordPat {string} path to .docx file.
 */
function ComparePageToWordFile(/**string*/refWordPath)
{
	Navigator.Open('');

	var el = /**HTMLObject*/Navigator.Find('//body');
	
	var lhs = "";
	
	var wordFileName = g_helper.ResolvePath(refWordPath);
	//Creates Microsoft Word object
	try
	{
		var msword = new ActiveXObject("Word.Application");
	}
	catch(e)
	{
		Tester.Assert("MS Word is not installed", true);
		return false;
	}
	
	msword.Visible = true;
	//Opens the doc file file
	var doc = msword.Documents.Open(wordFileName);
	
	//Gets the content of 'MSWord.doc' file
	doc.Select();
	doc.ActiveWindow.Selection.Copy();
	var lhs = Global.GetClipboardText();
	lhs = Global.DoTrim(lhs);
	
	doc.Close();
	
	//Quit application
	msword.Quit(0);
	
	var rhs = Navigator.ExecJS('execResult=el.innerText', el);
	return CompareText(lhs, refWordPath, rhs, "Page");
}


function ComparePageToTextFile(refPath)
{
	var el = /**HTMLObject*/Navigator.Find('//body');
	
	var lhs = File.Read(g_helper.ResolvePath(refPath));
	lhs = Global.DoTrim(lhs);
	var rhs = Navigator.ExecJS('execResult=el.innerText', el);
	rhs = Global.DoTrim(rhs);
	return CompareText(lhs, refPath, rhs, "Page");
}

function CompareText(lhs, lhsTitle, rhs, rhsTitle)
{
	var script_path = "%WORKDIR%\\diffmaker\\index.js";
	script_path = g_helper.ResolvePath(script_path);
	// Return instrumented verison of file, ready for eval
	var lhsFile = g_helper.GetDirectoryName(script_path)+'\\lhs.txt';
	var rhsFile = g_helper.GetDirectoryName(script_path)+'\\rhs.txt';
	File.Write(lhsFile, lhs);
	File.Write(rhsFile, rhs);
	var cmp = SeSCallNodeJS(script_path, {
		lhs: lhsFile,
		rhs: rhsFile,
		opts: {
			compare: 'lines',
			ignoreWhitespace: true,
			ignoreCase: false,
			ignoreAccents: false
		}
	});
	if( cmp ) {
		if( cmp.changes && cmp.changes.length )
		{
			var reportData = "";
			reportData = "<pre>"+cmp.diff.replace(/\>/gi, '&gt;').replace(/\</gi, '&lt;').replace(/\n/gi, '<br/>')+"</pre>";
			Tester.SoftAssert("Comparison Failed "+lhsTitle+"/"+rhsTitle, false, [new SeSReportText(reportData)]);
		} else {
			Tester.SoftAssert("Comparison Succeeded "+lhsTitle+"/"+rhsTitle, true);
		}
		return true;
	} else {
		Tester.SoftAssert('Problem in CompareText: error launching NodeJS script', false, script_path);
		return false;
	}
}

function SeSCallNodeJS(/**string*/script_path, input_data)
{
	script_path = g_helper.ResolvePath(script_path);
	// Return instrumented verison of file, ready for eval
	var cmd = g_helper.ResolvePath("InstrumentJS/node.exe");
	var inFile = g_helper.GetDirectoryName(script_path)+'\\input.json';
	var outFile = g_helper.GetDirectoryName(script_path)+'\\output.json';
	
	File.Write(inFile, JSON.stringify(input_data, null, '\t'));
	if(File.Exists(outFile))
	{
		File.Delete(outFile);
	}
	
	var cmdLine = '"'+cmd+'" "'+script_path+'"';

	if(l3) Log3("SeSCallNodeJS: calling "+cmdLine);

	var exitCode = g_util.Run(cmdLine, g_helper.GetDirectoryName(script_path), -1, false);
	
	if(File.Exists(outFile))
	{
		var result = JSON.parse(File.Read(outFile));
		return result;
	}
	
	return null;
}