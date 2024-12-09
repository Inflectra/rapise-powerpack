/**
 *  Loads all test case folders from Spira
 */
function SpiraImporterLoadTestCaseFolders(/**string*/ projectId)
{
	var req = SpiraApiUtil_GetSpiraRequest("GET", "projects/{project_id}/test-folders");
	req.SetParameter('project_id', projectId);
	
	var tcFolders = null;
	var res = req._DoExecute();
	
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
		else if (obj.TestCaseFolderId === rootFolderId) 
		{
			root = obj; // Set the root node
		}
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
	var res = req._DoExecute();
	
	if (res && res.status)
	{
		testCases = req.GetResponseBodyObject();
	}

	if (testCases != null)
	{
		for(var i = 0; i < testCases.length; i++)
		{
			SpiraImporterLoadTestSteps(testCases[i]);
		}
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
	var res = req._DoExecute();
	
	if (res && res.status)
	{
		testSteps = req.GetResponseBodyObject();
	}
	
	testCase.TestSteps = testSteps;
 }

