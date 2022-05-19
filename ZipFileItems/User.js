//Put your custom functions and variables in this file

function ZipFileItems(pathToZipFile)
{
	var objSA = WScript.CreateObject("Shell.Application");
	var zipFile = objSA.NameSpace(pathToZipFile);
	var resArr = [];

	function _EnumFolderItem(item, pfx){
		if(!item.IsFolder)
		{
			resArr.push(pfx+item.Name);
		} else {
			var f = item.GetFolder;
			pfx+=item.Name+"/";
			SeSEnumItems(f.Items(), _EnumFolderItem, pfx);
		}
	}

	function SeSEnumItems(items, cb, params)
	{
		var e = new Enumerator(items);
		for (;!e.atEnd();e.moveNext()) {      // Loop over the files in a folder
			var item = e.item();
			cb(item, params);
		}
	}

	SeSEnumItems(zipFile.Items(), _EnumFolderItem, "");

	//Log("Zip items: "+resArr.join(','));
	
	return resArr;

}

