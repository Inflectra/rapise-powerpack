
/**
 * @PageObject RapiseUtils provides various actions to perform framework-oriented tasks.
 * 
 * @Version 1.0.0
 */
SeSPageObject("RapiseUtils");

/**
 * Cleans AI cache, removes unused .json files from AI\commands folder.
 */
function RapiseUtils_CleanAICommandCache()
{
	var result = true;
	var usedAiCommands = {};

	function _processRvlFile(fullRvlPath)
	{
		var sw = new ActiveXObject("SeSWrappers.Utils.SpreadsheetWrapper");
		var res = sw.Open(fullRvlPath);
		var sheetNames = [];
		for(var i = 0; i < sw.GetSheetCount(); i++)
		{
			var n = sw.GetSheetName(i);
			sheetNames.push(n);
		}
		sw.Close();

		for(var sheetInd = 0; sheetInd < sheetNames.length; sheetInd++)
		{
			var sheet = sheetNames[sheetInd];
			var resObj = {};
			if(RVL.DoParseScript(fullRvlPath, sheet, undefined, undefined, resObj))
			{
				for(var i = 1; i < resObj.ctx.script.Rows.length; i++)
				{
					var row = resObj.ctx.script.Rows[i];
					if (row.Type == "AI")
					{
						var commandId = row.ParamValue;
						if (l2) Log2("AI Command: " + commandId);
						usedAiCommands[commandId] = 1;
					}
				}
			}
			else
			{
				return false;
			}
		}
		return true;
	}

	var rootPath = Global.GetFullPath("");
	var aiCommandRootPath = Global.GetFullPath("AI\\Commands");

	if (File.FolderExists(aiCommandRootPath)) 
	{
		var rvlFiles = File.Find(rootPath, "*.rvl.xlsx", true, false, true, false);
		rvlFiles = rvlFiles ? rvlFiles.split('\n') : [];
		for (var i = 0; i < rvlFiles.length; i++) 
		{
			var filePath = rvlFiles[i];
			var shortFilePath = filePath.replace(rootPath, ".");
			try 
			{
				if (l2) Log2("CleanAICache: processing " + shortFilePath);
				if (!_processRvlFile(filePath))
				{
					Log("CleanAICache: failed to parse " + shortFilePath);
					result = false;
				}
			} 
			catch (e)
			{
				Log("CleanAICache: failed to process " + shortFilePath + ": " + e.message);
				result = false;
			}
		}
		
		if (result)
		{
			var aiCommandFiles = File.Find(aiCommandRootPath, "*.json", true, false, true, false);
			aiCommandFiles = aiCommandFiles ? aiCommandFiles.split('\n') : [];
			for(var i = 0; i < aiCommandFiles.length; i++)
			{
				var filePath = aiCommandFiles[i];
				var shortFilePath = filePath.replace(aiCommandRootPath + "\\", "");
				var commandId = shortFilePath.replace(".json", "");
				if (l2) Log2("CleanAICache: AI cache file: " + shortFilePath);
				if (typeof(usedAiCommands[commandId]) == "undefined")
				{
					File.Delete(filePath);
					Tester.Message("Delete unused AI command cache file: " + shortFilePath);
				}
			}
		}
	} 
	else 
	{
		Log("CleanAICache:root path does not exist: " + rootPath);
	}
	return result;
}


