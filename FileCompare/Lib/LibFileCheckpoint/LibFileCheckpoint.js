eval(File.IncludeOnce('%WORKDIR%/Lib/LibFileCheckpoint/Checkpoint.js'));

/**
 * If you have alternative PDF implementation, override replace this function with
 * your version of the  PDF to Text converter
 */
global.GetPdfFileFullText = function(/**string*/path)
{
	if( typeof(PDF2)!='undefined' ) {
		return PDF2.GetFullText(path);
	} else {
		Tester.SoftAssert("You need LibPDF2 to enable PDF features. You may find it here: https://github.com/Inflectra/rapise-powerpack/tree/master/PDFTextExtractV2");
	}
	return null;
}