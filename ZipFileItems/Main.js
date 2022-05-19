//Use 'Record/Learn' button to begin test recording

function Test(params)
{
	var pathToZipFile = Global.GetFullPath('%WORKDIR%\\Reports.zip');
	var itemsArray = ZipFileItems(pathToZipFile);
	
	Tester.Message("Items: "+itemsArray.length, itemsArray);
}

