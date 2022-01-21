//Use 'Record/Learn' button to begin test recording

function Test(params)
{
	Navigator.Open('http://www.libraryinformationsystem.org/');

	ComparePageToTextFile( "Library Information System.txt" );
	ComparePageToWordFile( '%WORKDIR%/Library Information System.docx' );
	
}

g_load_libraries=["%g_browserLibrary%"]

