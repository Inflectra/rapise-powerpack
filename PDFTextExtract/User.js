//Put your custom functions and variables in this file


/** @scenario Pdf_GetFullText*/
function Pdf_GetFullText(/**string*/pdfPath)
{
// https://www.pdflib.com/download/tet/
// https://www.pdflib.com/binaries/TET/520/TET-5.2-MSWin32-COM.msi

	var tet = null;
	
	try
	{
		tet = new ActiveXObject("TET_com.TET");
	} catch(e) {
		Tester.Assert('TET library not found. Use links below to download and install', false, [
			new SeSReportLink("https://www.pdflib.com/binaries/TET/520/TET-5.2-MSWin32-COM.msi", "Installable Package"),
			new SeSReportLink("https://www.pdflib.com/download/tet/", "TET Download Page")
		]);
		return "";
	}

	var fulltext = "";
	var globaloptlist ="searchpath={{../data} {../../data}}";
	var pageoptlist = "granularity=page";
	var separator = '\r\n';
	var docoptlist = "";
	
	tet.set_option(globaloptlist);
	var doc = tet.open_document(pdfPath, docoptlist)
	var n_pages = tet.pcos_get_number(doc, "length:pages")

	Log("n_pages: "+n_pages);
	
	for(var pageno=1;pageno<=n_pages;pageno++)
	{
		var page = tet.open_page(doc, pageno, pageoptlist);
		if(page == -1)
		{
			Log("error reading page: "+pageno+" Error: "+tet.get_errnum()+" in "+tet.get_apiname()+" Msg: "+tet.get_errmsg());
		} else {

			do
			{
				var text = tet.get_text(page);
				fulltext += text;
			}
			while(text)

			if( tet.get_errnum() )
			{
				Log("error reading page: "+pageno+" Error: "+tet.get_errnum()+" in "+tet.get_apiname()+" Msg: "+tet.get_errmsg());
			}

		}
		tet.close_page(page);
		
	}
	
	tet.close_document(doc);
	tet = null;
	
	return fulltext;
}


function Pdf_EnsureText(/**string*/pdfPath, /**string*/textToFind, /**bool*/bAssert, /**string*/assertionMessage)
{
	var pdfText = Pdf_GetFullText(pdfPath);
	
	var bFound = pdfText.indexOf(textToFind)>0;
	
	if(bAssert!==false )
	{
		Tester.Assert(assertionMessage || "Text not found in PDF", bFound, [new SeSReportText(pdfPath), new SeSReportText(textToFind, "Text to find"), new SeSReportText(pdfText, "Document Text")]);
	}
	return bFound;
}