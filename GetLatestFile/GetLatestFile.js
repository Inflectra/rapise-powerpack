//Put your custom functions and variables in this file

/**
 * Find a file in the folder containing latest creation date.
 * Example: GetLatestFile('%USERPROFILE%\\Downloads') returns path
 * to last file downloaded by the browser
 */
function GetLatestFile(/**string*/folderPath)
{
	var fi = File.Find(folderPath, '*.*');
		
	var lastDate = new Date(0);
	var lastFile = "";
	
	var found = fi.split('\n');
	
	for(var i=0;i<found.length;i++)
	{
		Log('Checking: '+found[i]);
		
		var finf = File.Info(found[i]);
		var dc = finf.DateCreated;
		if(dc > lastDate)
		{
			lastDate = dc;
			lastFile = found[i];
		}
	}
	
	if(lastFile)
	{
		Log('Found last file: '+lastFile+' Created: '+lastDate);
		return lastFile;
	}
	Log('Nothing found in folder: '+folderPath);
	return null;
}