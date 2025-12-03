
function AutoRetryRequest(req)
{
	var response = req._DoExecute()
	if(!response.status)
	{
		Tester.Message("Re-try 1");
		Global.DoSleep(1000);
		response = req._DoExecute();
	}
	
	if(!response.status)
	{
		Tester.Message("Re-try 2");
		Global.DoSleep(10000);
		response = req._DoExecute();
	}
	
	if(!response.status)
	{
		Tester.Message("Re-try 3");
		Global.DoSleep(60000);
		response = req._DoExecute();
	}

	return response;
}

/**
 *  Loads all test case folders from Spira
 */
function SpiraImporterLoadTestCaseFolders(/**string*/ projectId)
{
	var req = SpiraApiUtil_GetSpiraRequest("GET", "projects/{project_id}/test-folders");
	req.SetParameter('project_id', projectId);
	
	var tcFolders = null;
	var res = AutoRetryRequest(req);
	
	if (res && res.status)
	{
		tcFolders = req.GetResponseBodyObject();
	}
	return tcFolders;
}

/**
 *  Builds a hierearchy of test case folders starting with rootFolderId
 */
function SpiraImporterBuildTestCaseFolderHierarchy(tcFolders, rootFolderId)
{
	// Create a map to store nodes by their TestCaseFolderId
	var nodeMap = {};
	var root = null;
	
	// Populate the map with nodes
	for (var i = 0; i < tcFolders.length; i++) 
	{
		var obj = tcFolders[i];
		obj.Children = []; // Add a children array to hold child nodes
		nodeMap[obj.TestCaseFolderId] = obj;
	}
	
	// Build the tree by linking parent and child nodes
	for (var i = 0; i < tcFolders.length; i++) 
	{
		var obj = tcFolders[i];
		if (obj.ParentTestCaseFolderId !== null && nodeMap[obj.ParentTestCaseFolderId]) 
		{
			nodeMap[obj.ParentTestCaseFolderId].Children.push(obj);
		} 
		
		if (obj.TestCaseFolderId === rootFolderId)
		{
			root = obj; // Set the root node
		}
	}
	
	// build root folder's path
	if (root)
	{
		var parentPath = "";
		var p = root;
		var sep = "";
		while (p.ParentTestCaseFolderId!=null)
		{
			var parentFolder = nodeMap[p.ParentTestCaseFolderId];
			parentPath = parentFolder.Name+sep+parentPath;
			sep = "/";
			p = parentFolder;
		}
		root._ParentFolderPath_ = parentPath;
	}
	
	return root; // Return the root of the tree
}

/**
 * Loads test cases for the folder and it's child folders
 */
function SpiraImporterLoadTestCases(projectId, tcFolder)
{
	var req = SpiraApiUtil_GetSpiraRequest("GET", "projects/{project_id}/test-folders/{test_case_folder_id}/test-cases?starting_row=1&number_of_rows=10000&sort_field={sort_field}&sort_direction=ASC&release_id=null");
	req.SetParameter('project_id', projectId);
	req.SetParameter('test_case_folder_id', tcFolder.TestCaseFolderId);
	
	var testCases = null;
	var res = AutoRetryRequest(req);
	
	if (res && res.status)
	{
		testCases = req.GetResponseBodyObject();
	}
	
	tcFolder.TestCases = testCases;

	for (var i = 0; i < tcFolder.Children.length; i++)
	{
		SpiraImporterLoadTestCases(projectId, tcFolder.Children[i]);
	}
}

/**
 * Loads test steps for a test case
 */
 function SpiraImporterLoadTestSteps(testCase)
 {
 	var req = SpiraApiUtil_GetSpiraRequest("GET", "projects/{project_id}/test-cases/{test_case_id}/test-steps");
	req.SetParameter('project_id', testCase.ProjectId);
	req.SetParameter('test_case_id', testCase.TestCaseId);

	var testSteps = null;
	var res = AutoRetryRequest(req);
	
	if (res && res.status)
	{
		testSteps = req.GetResponseBodyObject();
	}
	
	testCase.TestSteps = testSteps;
 }


//#region Importer

function SpiraImporterTraverseTestCaseFolders(folder, cb, currentPath = "") {
	// Construct the current path (avoid leading slash if at root)
	const newPath = currentPath ? currentPath + "/" + folder.Name : folder.Name;

	// Call cb on each test case in this folder
	if (folder.TestCases && folder.TestCases.length > 0) {
		for (let i = 0; i < folder.TestCases.length; i++) {
			const tc = folder.TestCases[i];
			if( cb(newPath, tc) === false ) {
				return false;
			}
		}
	}

	// Recurse into child folders if they exist
	if (folder.Children && folder.Children.length > 0) {
		for (let j = 0; j < folder.Children.length; j++) {
			const childFolder = folder.Children[j];
			if( SpiraImporterTraverseTestCaseFolders(childFolder, cb, newPath) === false ) {
				return false;
			}
		}
	}
}

global.g_spiraJsonPath = "%WORKDIR%Lib\\LibFramework\\Spira.json";

function SpiraImporterGetSpiraJson()
{
	let json = {};
	const failMsg = 'This framework must be syncrhonized with Spira first. Use Spira Dashboard to synchronize.';
	if( File.Exists(global.g_spiraJsonPath) )
	{
		json = File.Read(global.g_spiraJsonPath);
	} else {
		Tester.Assert(failMsg, false);
		return null;
	}
	
	const spiraJson = JSON.parse(json);
	if(!spiraJson.projectId)
	{
		Tester.Assert(failMsg, false);
		return null;
	}
	
	spiraJson.testcases = spiraJson.testcases || [];
	return spiraJson;
}

function SpiraImporterRegisterTC(testCaseId, spiraId)
{
	const data = SpiraImporterGetSpiraJson();
	const foundSpira = SpiraImporterFindTCIdBySpiraId(spiraId);
	const foundTC = SpiraImporterFindSpiraIdByTCId(testCaseId);
	if (foundSpira)
	{
		if ("" + foundSpira != "" + spiraId) {
			Tester.SoftAssert("Test case: " + testCaseId + " already attached to another spira test case: " + spiraId, false);
			return false;
		}
	} else if (foundTC) {
		if ("" + foundTC != "" + testCaseId) {
			Tester.SoftAssert("There is another test case: " + testCaseId + " for a give spira test case: " + spiraId, false);
			return false;
		}
	} else {
		data.testcases.push({ id: testCaseId, spiraId });
		File.Write(global.g_spiraJsonPath, JSON.stringify(data, null, "\t"));
	}
	return true;
}

function SpiraImporterFindTCIdBySpiraId(spiraId)
{
	const data = SpiraImporterGetSpiraJson();

	for (let i = 0; i < data.testcases.length; i++) {
		if (data.testcases[i].spiraId === spiraId) {
			return data.testcases[i].id;
		}
	}
	return null; // not found
}

function SpiraImporterFindSpiraIdByTCId(testCaseId)
{
	const data = SpiraImporterGetSpiraJson();
	for (let i = 0; i < data.testcases.length; i++) {
		if (data.testcases[i].id === testCaseId) {
			return data.testcases[i].spiraId;
		}
	}
	return null; // not found
}

function FixTCName(/**string*/name) {
	let res = "";
	for(var i=0;i<name.length;i++) {
		let chr = name.charAt(i);
		if( "\\/:*?\"<>|".indexOf(name.charAt(i))>=0 ) {
			chr = '_';
		}
		res+=chr;
	}
	return FixWhiteSpace(Text.Trim(res));
}

function FixWhiteSpace(/**string*/name) {
	if (typeof name !== "string") return name;

	// 1. Trim leading and trailing whitespace
	var result = name.trim();

	// 2. Replace invisible/non-breaking spaces and other zero-width chars
	result = result
		.replace(/\u00A0/g, " ")                  // Unicode non-breaking space
		.replace(/[\u0080-\u009F]/g, "")          // C1 Control Characters
		.replace(/[\u200B-\u200D\uFEFF]/g, "")    // Zero-width spaces, etc.
		.replace(/\s+/g, " ");                    // Normalize multiple spaces

	// 3. Remove emojis and pictographs
	result = result.replace(
		/[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{Emoji}\uFE0F]/gu,
		""
	);

	return result;
}

function SpiraImporterImportTestCases(data)
{

	function areTimesEqual(concurrencyDateStr, lastUpdateDateStr) {
	  if(!concurrencyDateStr ||!lastUpdateDateStr) 
	  {
	  	return false;
	  }
	  // Attempt to normalize concurrencyDateStr to an ISO-like format
	  // The given format: "2024-12-09 10:23:31.977"
	  // Replace the space with 'T' and append 'Z' to assume UTC:
	  let normalizedConcurrency = concurrencyDateStr.replace(" ", "T") + "Z";
	
	  // lastUpdateDateStr should already be in ISO format: "2024-12-09T10:23:31.977Z"
	  // In case it's not, we assume it is and trust Date parsing.
	
	  let date1 = new Date(normalizedConcurrency);
	  let date2 = new Date(lastUpdateDateStr);
	
	  // Compare their numeric values (milliseconds since epoch)
	  return date1.getTime() === date2.getTime();
	}

	// Call it to check there is proper Spira.json available
	var spiraJson = SpiraImporterGetSpiraJson();

	var rapiseApp = g_util.GetRapiseApp();

	let totalImported = 0;
	let totalCreated = 0;

	if( ""+data.TestCaseFolderId==""+spiraJson.testCasesFolderId ) {
		// When we are importing from the framework own folder, ignore that root folder name in the path.
		data.Name = "";
	}

	var rootPath = "";
	if (data._ParentFolderPath_)
	{
		if (!File.FolderExists(data._ParentFolderPath_))
		{
			File.CreateFolder(data._ParentFolderPath_)
		}
		// There is a folder structure already created - use it
		if (File.FolderExists(data._ParentFolderPath_))
		{
			rootPath = data._ParentFolderPath_;
		}
	}

	SpiraImporterTraverseTestCaseFolders(data, function (path, testCase) {
		Tester.Message(`Checking ${path}/${testCase.Name}`, `Id: ${testCase.TestCaseId} Folder: ${testCase.TestCaseFolderId}`);

		const spiraId = testCase.TestCaseId;
		const tcId = SpiraImporterFindTCIdBySpiraId(spiraId);

		let tc = null;
		if (tcId)
		{
			tc = rapiseApp.GetTestById(tcId);
		}
		if (!tc)
		{
			if( testCase.AutomationAttachmentId ) {
				if(g_serverRepositoryType!='git') {
					Tester.Message(`Skip test case: ${path}/${testCase.Name}, it is already automated and not found in this framework`);
					return;
				}
				// If it is git then automation files are part of the repository and we assume that it is stored in the same path in the same repository.
				Tester.Message(`Re-importing: ${path}/${testCase.Name}, it is already automated, assuming it is in the same Git repository`);
			}
			const aliasName = FixWhiteSpace(Text.Trim(testCase.Name));
			const fixedName = FixTCName(testCase.Name);
			tc = rapiseApp.CreateTestCase(fixedName, path, true);
			if (aliasName!=fixedName) {
				tc.AliasName = aliasName;
				tc.Save();
			}
			Tester.Message("Created: " + testCase.Name, path);
			totalCreated++;
			SpiraImporterRegisterTC(tc.Id, testCase.TestCaseId);
		} else {
			Log("Found existing TC");
		}

		const rmtPath = tc.GetAbsolutePath("ManualSteps.rmt");
		let changed = true;
		if( File.Exists(rmtPath) ) {
			const rmt = JSON.parse(File.Read(rmtPath));
			const rmtLastModified = rmt.ConcurrencyDate;
			const spiraLastModified = testCase.LastUpdateDate;
			
			if( areTimesEqual(rmtLastModified, spiraLastModified) )
			{
				changed = false;
				Tester.Message('Test Case is the same, keep it.', [rmtLastModified, spiraLastModified])
			}
			
		}

		if(changed)
		{
			Tester.Message('Test Case Changed, re-importing and marking as draft.', tc.Name)
			rapiseApp.ImportManual(tc, testCase.ProjectId, testCase.TestCaseId);
			rapiseApp.BeginUpdate();
			tc.AddTag("draft");
			rapiseApp.EndUpdate();
		}
		
		totalImported++;
		//if( totalImported==4 ) return false;
	},
	rootPath // where to create a test case
	);

	Tester.Assert(`Imported: ${totalImported} Created: ${totalCreated}`, true);
	
	rapiseApp.SaveAll();
	
	rapiseApp.DoGlobalCommand("Generate Metadata");
	rapiseApp.DoGlobalCommand("SoftRefreshSpiraDashboard");
}
//#endregion Importer
