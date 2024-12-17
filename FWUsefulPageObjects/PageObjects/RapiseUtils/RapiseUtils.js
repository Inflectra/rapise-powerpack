
/**
 * @PageObject RapiseUtils provides various actions to perform framework-oriented tasks.
 * 
 * @Version 1.0.5
 */
SeSPageObject("RapiseUtils");

eval(File.IncludeOnce('%WORKDIR%/PageObjects/RapiseUtils/SpiraImporter.js'));

/**
 * Converts AI Command structure to new format: 
 * Single ai.commands.json per Test Case/Page Object located in the same folder
 * as an RVL file that contains these commands.
 */ 
function RapiseUtils_ConvertAICommandRepository()
{
	var aiCommandRootPath = Global.GetFullPath("AI\\Commands");
	var aiCommandFiles = File.Find(aiCommandRootPath, "*.json", true, false, true, false);
	aiCommandFiles = aiCommandFiles ? aiCommandFiles.split('\n') : [];
	for(var i = 0; i < aiCommandFiles.length; i++)
	{
		var filePath = aiCommandFiles[i];
		var shortFilePath = filePath.replace(aiCommandRootPath + "\\", "");
		var commandId = shortFilePath.replace(".json", "");
		try
		{
			var aiCommand = JSON.parse(File.Read(filePath));
			var sourceRvlPath = aiCommand.sourceFile;
			if (l2) Log2("ConvertAICommandRepository: AI command " + commandId + " is used in " + sourceRvlPath);
			if (sourceRvlPath)
			{
				var sourceRvlFolder = sourceRvlPath.replace("\\Main.rvl.xlsx", "");
				if (File.FolderExists(sourceRvlFolder))
				{
					var commandCacheFileName = sourceRvlPath.replace("Main.rvl.xlsx", "ai.commands.json");
					var cachedItems = {};
					if (File.Exists(commandCacheFileName))
					{
						cachedItems = JSON.parse(File.Read(commandCacheFileName));
					}
					cachedItems[commandId] = aiCommand;
					File.Write(commandCacheFileName, JSON.stringify(cachedItems, null, 2));
					Log("ConvertAICommandRepository: command " + commandId + " copied to " + commandCacheFileName);
				}
			}
		}
		catch (e)
		{
			Log("ConvertAICommandRepository: error reading AI command: " + commandId);
		}
	}
}

/**
 * Cleans AI cache, removes unused commands from ai.commands.json files.
 */
function RapiseUtils_CleanAICommandCache()
{
	function _processRvlFile(fullRvlPath)
	{
		var usedAiCommands = {};
		
		var sw = new ActiveXObject("SeSWrappers.Utils.SpreadsheetWrapper");
		var res = sw.Open(fullRvlPath);
		var sheetNames = [];
		for(var i = 0; i < sw.GetSheetCount(); i++)
		{
			var n = sw.GetSheetName(i);
			sheetNames.push(n);
		}
		sw.Close();

		for (var sheetInd = 0; sheetInd < sheetNames.length; sheetInd++)
		{
			var sheet = sheetNames[sheetInd];
			var resObj = {};
			if (RVL.DoParseScript(fullRvlPath, sheet, undefined, undefined, resObj))
			{
				for (var i = 1; i < resObj.ctx.script.Rows.length; i++)
				{
					var row = resObj.ctx.script.Rows[i];
					if (row.Type == "AI")
					{
						var commandId = row.ParamValue;
						if (l2) Log2("CleanAICache2: found AI command: " + commandId);
						usedAiCommands[commandId] = 1;
					}
				}
			}
			else
			{
				return false;
			}
		}
		
		var commandCacheFileName = fullRvlPath.replace("Main.rvl.xlsx", "ai.commands.json");
		var commandCacheShortFileName = commandCacheFileName.replace(rootPath, ".");
		var cachedItems = {};
		if (File.Exists(commandCacheFileName))
		{
			cachedItems = JSON.parse(File.Read(commandCacheFileName));
		}
		
		var itemsRemoved = false;
		for (var key in cachedItems) 
		{ 
			if (!usedAiCommands.hasOwnProperty(key))
			{ 
				delete cachedItems[key]; 
				itemsRemoved = true;
				Log("CleanAICache2: unused AI command " + key + " deleted from " + commandCacheShortFileName);
			} 
		}
		
		if (itemsRemoved)
		{
			File.Write(commandCacheFileName, JSON.stringify(cachedItems, null, 2));
		}
		
		return true;
	}

	var rootPath = Global.GetFullPath("");
	var rvlFiles = File.Find(rootPath, "*.rvl.xlsx", true, false, true, false);
	rvlFiles = rvlFiles ? rvlFiles.split('\n') : [];
	for (var i = 0; i < rvlFiles.length; i++) 
	{
		var filePath = rvlFiles[i];
		var shortFilePath = filePath.replace(rootPath, ".");
		try 
		{
			if (l2) Log2("CleanAICache2: processing " + shortFilePath);
			if (!_processRvlFile(filePath))
			{
				Log("CleanAICache2: failed to parse " + shortFilePath);
				result = false;
			}
		} 
		catch (e)
		{
			Log("CleanAICache2: failed to process " + shortFilePath + ": " + e.message);
			result = false;
		}
	}
}

/**
 * Cleans AI cache, removes unused .json files from AI\commands folder.
 */
function RapiseUtils_CleanAICommandCacheDeprecated()
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

		for (var sheetInd = 0; sheetInd < sheetNames.length; sheetInd++)
		{
			var sheet = sheetNames[sheetInd];
			var resObj = {};
			if (RVL.DoParseScript(fullRvlPath, sheet, undefined, undefined, resObj))
			{
				for (var i = 1; i < resObj.ctx.script.Rows.length; i++)
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


/**
 * Loads test case hierarchy recursively
 */
function RapiseUtils_DoImportManual(/**number*/ projectId, /**number*/ testCaseFolderId)
{
	if(!testCaseFolderId)
	{
		var rapiseApp = g_util.GetRapiseApp();
		rapiseApp.ShowMainWindow();
		testCaseFolderId = rapiseApp.DoUserAction("AddInSpiraTest.SelectSpiraFolder");
		projectId = rapiseApp.DoUserAction("AddInSpiraTest.GetLastProjectId");
	}
	
	var tcFolders = SpiraImporterLoadTestCaseFolders(projectId, testCaseFolderId);
	
	if (!tcFolders)
	{
		return new SeSDoActionResult(false, null, "Failed to load Test Case Folders.");
	}
	
	var tcRootFolder = SpiraImporterBuildTestCaseFolderHierarchy(tcFolders, testCaseFolderId);
	
	if (!tcRootFolder)
	{
		return new SeSDoActionResult(false, null, "Failed to find root Test Case Folder.");
	}
	
	SpiraImporterLoadTestCases(projectId, tcRootFolder);
	
	var cnts = JSON.stringify(tcRootFolder, null, 2);
	File.Write("ManualExport.json", cnts);	
	
	SpiraImporterImportTestCases(tcRootFolder);
	
	return true;
}
