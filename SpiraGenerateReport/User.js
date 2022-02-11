
function Spira_GenerateReport(scope, reportName, incidentId, projectId)
{
	reportName = reportName || "Report.html";

	var model = {
		testSets: []
	};	
	
	if (typeof(scope) == "number")
	{
		SpiraUtil_GenerateReportForProject(scope, null, model);
		projectId = projectId || scope;
	}
	else
	{
		for(var i = 0; i < scope.length; i++)
		{
			var s = scope[i];
			if (typeof(s) == "number")
			{
				SpiraUtil_GenerateReportForProject(s, null, model);
			}
			else if (typeof(s) == "object" && s.projectId && s.testSetIds)
			{
				SpiraUtil_GenerateReportForProject(s.projectId, s.testSetIds, model);
			}
		}
	}

	SpiraUtil_OutputReportHtml(model, reportName);
	SpiraUtil_UploadReport(model, reportName, projectId, incidentId);
}

function SpiraUtil_GenerateReportForProject(projectId, testSetIds, model)
{
	SpiraUtil_QueryExecutionStatus72(projectId, testSetIds, model);
	//SpiraUtil_QueryExecutionStatus73(projectId, testSetIds, model);
}

function SpiraUtil_QueryExecutionStatus72(projectId, testSetIds, model)
{
	var project = SpiraUtil_GetProject(projectId);
	var testSets = [];
	if (testSetIds)
	{
		testSets = SpiraUtil_GetTestSetsByIds(projectId, testSetIds);
	}
	else
	{
		testSets = SpiraUtil_GetTestSetsExecutedToday(projectId, null);
	}
	Tester.Message("Found Test Set count: " + testSets.length);
	
	model.testSets.push.apply(model.testSets, testSets);

	for(var i = 0; i < testSets.length; i++)
	{
		var testSet = testSets[i];
		
		testSet.projectName = project.Name;
		
		Tester.Message("Processing: " + testSet.projectName + "/" + testSet.Name);
		
		// Get test cases in test set
		// Load latest run for each such test case, it should be of specific date
		var testCaseMappings = SpiraUtil_GetTestCaseMappings(projectId, testSet.TestSetId);
		if (testCaseMappings)
		{
			var failed = 0;
			var passed = 0;
			var notrun = 0;
			var blocked = 0;
		
			testSet.testRuns= [];
		
			for(var j = 0; j < testCaseMappings.length; j++)
			{
				var testCaseMapping = testCaseMappings[j];
				var tr = SpiraUtil_GetLatestTestRunForTestCaseMapping(projectId, testCaseMapping);
				testSet.testRuns.push(tr);
				
				switch(tr.ExecutionStatusId)
				{
					case 1:
						failed++;
						break;
					case 2:
						passed++;
						break;
					case 5:
						blocked++;
						break;
					default:
						notrun++;
						break;
				}
			}
			
			testSet.executionStatus = { passed: passed, failed: failed, blocked: blocked };
		}
	}
}

function SpiraUtil_QueryExecutionStatus73(projectId, testSetIds, model)
{
	var project = SpiraUtil_GetProject(projectId);
	var testSets = [];
	if (testSetIds)
	{
		testSets = SpiraUtil_GetTestSetsByIds(projectId, testSetIds);
	}
	else
	{
		testSets = SpiraUtil_GetTestSetsExecutedToday(projectId, null);
	}
	Tester.Message("Found Test Set count: " + testSets.length);
	
	model.testSets.push.apply(model.testSets, testSets);
	
	for(var i = 0; i < testSets.length; i++)
	{
		var testSet = testSets[i];
		
		testSet.projectName = project.Name;
		
		Tester.Message("Processing: " + testSet.projectName + "/" + testSet.Name);
		
		var latestTestRun = SpiraUtil_GetLatestTestRunForTestSet(testSet);
		if (latestTestRun)
		{
			Tester.Message("Latest Test Run tag: " + latestTestRun.RunnerTestName);
			var relatedTestRuns = SpiraUtil_GetRelatedTestRunsFor(latestTestRun);
			testSet.testRuns = relatedTestRuns;
			if (relatedTestRuns)
			{
				var failed = 0;
				var passed = 0;
				var notrun = 0;
				var blocked = 0;

				for(var j = 0; j < relatedTestRuns.length; j++)
				{
					var tr = relatedTestRuns[j];
					switch(tr.ExecutionStatusId)
					{
						case 1:
							failed++;
							break;
						case 2:
							passed++;
							break;
						case 5:
							blocked++;
							break;
						default:
							notrun++;
							break;
					}
				}
				
				testSet.executionStatus = { passed: passed, failed: failed, blocked: blocked };
				
				Tester.Message("Execution status: passed: " + passed + ", failed: " + failed + ", blocked: " + blocked);
			}
		}
	}
}

function SpiraUtil_OutputReportHtml(model, fn)
{
	var config = SpiraApiUtil_GetSpiraConfig();
	var serverUrl = config.SpiraServer;
	
	function ln(msg)
	{
		File.Append(fn, msg + "\r\n");
	}
	
	function createBackLink(projectId, itemType, itemId)
	{
		return serverUrl + projectId + "/" + itemType + "/" + itemId + ".aspx";
	}

	File.Write(fn, "<h1>Test Execution Report</h1>");
	ln("");
	ln("<h2>Executed Test Sets</h2>");
	ln("");
	
	ln('<table class="table">');
	ln('  <thead>');
	ln('	<tr>');
	ln('	  <th scope="col">#</th>');
	ln('	  <th scope="col">Name</th>');
	ln('	  <th scope="col">Passed</th>');
	ln('	  <th scope="col">Failed</th>');
	ln('	  <th scope="col">Blocked</th>');
	ln('	</tr>');
	ln('  </thead>');
	ln('  <tbody>');

	var passed = 0;
	var failed = 0;
	var blocked = 0;
	
	for(var i = 0; i < model.testSets.length; i++)
	{
		var testSet = model.testSets[i];
		passed += testSet.executionStatus.passed;
		failed += testSet.executionStatus.failed;
		blocked += testSet.executionStatus.blocked;
	}

	ln('<tr>');
	ln('  <th scope="row">Total</th>');
	ln('  <td>&nbsp;</td>');
	ln('  <td><span style="color:green;font-size: large;">' + passed + '</span></td>');
	ln('  <td><span style="' + (failed > 0 ? "color:red;" : "") + 'font-size: large;">' + failed + '</span></td>');
	ln('  <td><span style="' + (blocked > 0 ? "color:red;" : "") + 'font-size: large;">' + blocked + '</span></td>');
	ln('</tr>');	
	
	for(var i = 0; i < model.testSets.length; i++)
	{
		var testSet = model.testSets[i];

		var color = "color:green";
		
		if (testSet.executionStatus.failed > 0)
		{
			color = "color:red";
		}
		else if (testSet.executionStatus.blocked > 0)
		{
			color = "color:red";
		}

		ln('<tr>');
		ln('  <th scope="row">' + (i + 1) + '</th>');
		ln('  <td><a style="' + color + '" target="_blank" href="' + createBackLink(testSet.ProjectId, "TestSet", testSet.TestSetId) + '">' + testSet.projectName + "/" + testSet.Name + '</a></td>');
		ln('  <td><span>' + testSet.executionStatus.passed + '</span></td>');
		ln('  <td><span style="' + (testSet.executionStatus.failed > 0 ? "color:red;" : "") + '">' + testSet.executionStatus.failed + '</span></td>');
		ln('  <td><span style="' + (testSet.executionStatus.blocked > 0 ? "color:red;" : "") + '">' + testSet.executionStatus.blocked + '</td>');
		ln('</tr>');
	}
	
	ln('  </tbody>');
	ln('</table>');	
	
	ln("");
	ln("<h2>Failed Test Cases</h2>");
	ln("");
	ln("<ul>");
	for(var i = 0; i < model.testSets.length; i++)
	{
		var testSet = model.testSets[i];
		for(var j = 0; j < testSet.testRuns.length; j++)
		{
			var testRun = testSet.testRuns[j];
			if (testRun.ExecutionStatusId != 2 /* passed */)
			{
				ln('<li><a target="_blank" href="' + createBackLink(testSet.ProjectId, "TestCase", testRun.TestCaseId) + '">' + testSet.projectName + "/" + testSet.Name + "/" + testRun.Name + "</a></li>");
			}
		}
	}
	ln("</ul>");
	ln("");
	ln("<h2>Failures</h2>");
	
	for(var i = 0; i < model.testSets.length; i++)
	{
		var testSet = model.testSets[i];
		for(var j = 0; j < testSet.testRuns.length; j++)
		{
			var testRun = testSet.testRuns[j];
			if (testRun.ExecutionStatusId != 2 /* passed */)
			{
				ln("");
				ln("<h3>" + testSet.projectName + "/" + testSet.Name + "/" + testRun.Name + "</h3>");
				ln("");
				ln('<a target="_blank" href="' + createBackLink(testSet.ProjectId, "TestRun", testRun.TestRunId) + '">Open test run</a>');
				ln("");

				ln("<h4>Parameters</h4>");
				ln("");
				
				var parameters = SpiraUtil_ExtractTestRunParameters(testRun.RunnerStackTrace); 
				if (parameters)
				{
					ln(parameters);
				}
				else
				{
					ln("no parameters");
				}
				
				ln("");
				ln("<h4>Failure</h4>");
				ln("");
				var failureDescription = "";
				
				if (testRun.ExecutionStatusId == 1)
				{ // failed
					 failureDescription = SpiraUtil_GetTestRunFailureDetails(testRun, true);
				}
				else if (testRun.ExecutionStatusId == 5)
				{ // blocked
					failureDescription = testRun.RunnerMessage;
				}
				
				ln(failureDescription);
			}
		}
	}
	
	ln("<h2>Execution Log</h2>");
	ln("<ul>")
	for(var i = 0; i < model.testSets.length; i++)
	{
		var testSet = model.testSets[i];
	
		ln("<li>")
			ln(testSet.projectName + "/" + testSet.Name);
			ln("<ul>");
			for(var j = 0; j < testSet.testRuns.length; j++)
			{
				var testRun = testSet.testRuns[j];
				if (testRun.ExecutionStatusId == 2 /* passed */)
				{
					ln("<li>" + testRun.Name + "</li>");
				}
				else
				{
					ln('<li style="color:red">' + testRun.Name + "</li>");
				}
			}
			ln("</ul>");
		ln("</li>")
	}
	ln("</ul>");
	
}

function SpiraUtil_UploadReport(model, fn, projectId, incidentId)
{
	if (!projectId)
	{
		if (incidentId)
		{
			Tester.Assert("Specify parent project id for the incident: " + incidentId, false);
		}
		else
		{
			Tester.Message("No incident specified, skip report uploading");
		}
		return;
	}

	var config = SpiraApiUtil_GetSpiraConfig();
	var serverUrl = config.SpiraServer;

	var reportFolderName = "Test Execution Reports";
	var documentFolders = SpiraUtil_LoadDocumentFolders(projectId);
	if (documentFolders)
	{
		var rootDocumentFolderId;
		var reportsFolderId;
		for(var i = 0; i < documentFolders.length; i++)
		{
			var df = documentFolders[i];
			if (df.ParentProjectAttachmentFolderId == null)
			{
				rootDocumentFolderId = df.ProjectAttachmentFolderId;
			}
			
			if (df.Name == reportFolderName)
			{
				reportsFolderId = df.ProjectAttachmentFolderId;
			}
		}
		
		if (!reportsFolderId)
		{
			reportsFolderId = SpiraUtil_CreateDocumentFolder(projectId, rootDocumentFolderId, reportFolderName);
		}
		
		
		if (reportsFolderId)
		{
			var defaultDocumentTypeId;
			var documentTypes = SpiraUtil_LoadDocumentTypes(projectId);
			if (documentTypes)
			{
				for(var i = 0; i < documentTypes.length; i++)
				{
					var dt = documentTypes[i];
					if (dt.Default == true)
					{
						defaultDocumentTypeId = dt.DocumentTypeId;
						break;
					}
				}
				
				if (defaultDocumentTypeId)
				{
					var name = UtilGetPaddedZeroesDateTime(new Date()) + " " + fn;
					var base64String = g_util.ByteArrayAsBase64(g_util.ReadFileAsByteArray(Global.GetFullPath(fn)));
					var document = SpiraUtil_UploadDocument(projectId, reportsFolderId, defaultDocumentTypeId, name, base64String)
					if (document && incidentId)
					{
						// summary
						var text = "";
						
						function ln(msg)
						{
							text += msg + "\r\n";
						}
						
						var passed = 0;
						var failed = 0;
						var blocked = 0;
						
						ln("<ul>");
						for(var i = 0; i < model.testSets.length; i++)
						{
							var testSet = model.testSets[i];
							passed += testSet.executionStatus.passed;
							failed += testSet.executionStatus.failed;
							blocked += testSet.executionStatus.blocked;
						}

						ln("<h4>Executed Test Case Summary</h4>");
						ln("<ul>");
						ln('<li>Passed: <span style="color:green;font-size: large;">' + passed + '</span></li>');
						ln('<li>Failed: <span style="' + (failed > 0 ? "color:red;" : "") + 'font-size: large;">' + failed + '</span></li>');
						ln('<li>Blocked: <span style="' + (blocked > 0 ? "color:red;" : "") + 'font-size: large;">' + blocked + '</span></li>');
						ln("</ul>");
						
						ln("<h4>Failed Test Cases</h4>");
						ln("<ul>");
						for(var i = 0; i < model.testSets.length; i++)
						{
							var testSet = model.testSets[i];
							for(var j = 0; j < testSet.testRuns.length; j++)
							{
								var testRun = testSet.testRuns[j];
								if (testRun.ExecutionStatusId != 2 /* passed */)
								{
									ln("<li>" + testSet.projectName + "/" + testSet.Name + "/" + testRun.Name + "</li>");
									ln("<ul>");
									var parameters = SpiraUtil_ExtractTestRunParameters(testRun.RunnerStackTrace);
									ln("<li>Parameters: " + parameters + "</li>");
									var failureDescription = "";
									if (testRun.ExecutionStatusId == 1)
									{ // failed
										 failureDescription = SpiraUtil_GetTestRunFailureDetails(testRun, false);
									}
									else if (testRun.ExecutionStatusId == 5)
									{ // blocked
										failureDescription = testRun.RunnerMessage;
									}
									ln("<li>Failure: " + failureDescription + "</li>");
									ln("</ul>");
								}
							}
						}	
						ln("</ul>");
						
						ln("<h4>Executed Test Sets</h4>");
						ln("<ul>");
						for(var i = 0; i < model.testSets.length; i++)
						{
							var testSet = model.testSets[i];
							
							var color = "color:green";
							
							if (testSet.executionStatus.failed > 0)
							{
								color = "color:red";
							}
							else if (testSet.executionStatus.blocked > 0)
							{
								color = "color:#333300";
							}
							
							ln("<li style='" + color + "'>" + testSet.projectName + "/" + testSet.Name + "</li>");
						}
						ln("</ul>");
						
						ln("<h4>Full Report Link</h4>");
						ln("");
					
						// back link
						var backlink = serverUrl + projectId + "/Document/" + document.AttachmentId + "/Preview.aspx";

						ln('<a target="_blank" href="' + backlink + '">Open report in Spira</a>');
						
						// add comment to an incident
						SpiraUtil_AddIncidentComment(projectId, incidentId, text);
					}
				}
			}
		}
	}
}

function SpiraUtil_GetTestCaseMappings(projectId, testSetId)
{
	var query = "projects/{project_id}/test-sets/{test_set_id}/test-case-mapping";
	var req = SpiraApiUtil_GetSpiraRequest("GET", query);
	req.SetParameter('project_id', projectId);
	req.SetParameter('test_set_id', testSetId);

	var response = req._DoExecute();
	
	if(response.status)
	{
		var testCases = req.GetResponseBodyObject();
		return testCases;
	} else {
		SpiraApiUtil_LogError('Failed to load test cases for test set: ' + testSetId);
		return false;
	}
}

function SpiraUtil_AddIncidentComment(projectId, incidentId, text)
{
	var query = "projects/{project_id}/incidents/{incident_id}/comments"
	var postData = [{"Text": text}];
	
	var req = SpiraApiUtil_GetSpiraRequest("POST", query);
	req.SetParameter('project_id', projectId);
	req.SetParameter('incident_id', incidentId);
	req.SetRequestBodyObject(postData);	

	var response = req._DoExecute();
	
	if(response.status)
	{
		var comment = req.GetResponseBodyObject();
		return comment;
	} else {
		SpiraApiUtil_LogError('Failed to add comment to incident: ' + incidentId);
		return false;
	}
}


function SpiraUtil_UploadDocument(projectId, documentFolderId, documentTypeId, name, base64String)
{
	var query = "projects/{project_id}/documents/file";
	var postData = 
	{
		BinaryData: base64String,
		AttachmentTypeId: 1,
		DocumentTypeId: documentTypeId,
		ProjectAttachmentFolderId: documentFolderId,
		FilenameOrUrl: name,
		ProjectId: projectId,
		Tags: "report"
	};

	var req = SpiraApiUtil_GetSpiraRequest("POST", query);
	req.SetParameter('project_id', projectId);
	req.SetRequestBodyObject(postData);	

	var response = req._DoExecute();
	
	if(response.status)
	{
		var document = req.GetResponseBodyObject();
		return document;
	} else {
		SpiraApiUtil_LogError('Failed to upload document in project: ' + projectId);
		return false;
	}
}

function SpiraUtil_LoadDocumentTypes(projectId)
{
	var project = SpiraUtil_GetProject(projectId);
	
	if (!project)
	{
		return null;
	}
	
	var projectTemplateId = project.ProjectTemplateId;
	var query = "project-templates/{project_template_id}/document-types?active_only=true";
	
	var req = SpiraApiUtil_GetSpiraRequest("GET", query);
	req.SetParameter('project_template_id', projectTemplateId);
	
	var response = req._DoExecute();
	
	if(response.status)
	{
		var documentTypes = req.GetResponseBodyObject();
		return documentTypes;
	} else {
		SpiraApiUtil_LogError('Failed to load document types in project: ' + projectId);
		return false;
	}
}

function SpiraUtil_GetProject(projectId)
{
	var query = "projects/{project_id}";
	var req = SpiraApiUtil_GetSpiraRequest("GET", query);
	req.SetParameter('project_id', projectId);
	
	var response = req._DoExecute();
	
	if(response.status)
	{
		var project = req.GetResponseBodyObject();
		return project;
	} else {
		SpiraApiUtil_LogError('Failed to load project: ' + projectId);
		return false;
	}
}

function SpiraUtil_CreateDocumentFolder(projectId, parentFolderId, name)
{
	var query = "projects/{project_id}/document-folders";
	
	var postData = {"ParentProjectAttachmentFolderId": parentFolderId, "Name": name};
	
	var req = SpiraApiUtil_GetSpiraRequest("POST", query);
	req.SetParameter('project_id', projectId);
	req.SetRequestBodyObject(postData);
	
	var response = req._DoExecute();
	
	if(response.status)
	{
		var documentFolder = req.GetResponseBodyObject();
		return documentFolder.ProjectAttachmentFolderId;
	} else {
		SpiraApiUtil_LogError('Failed to create report folder in project: ' + projectId);
		return false;
	}
}

function SpiraUtil_LoadDocumentFolders(projectId)
{
 	var query = "projects/{project_id}/document-folders";
	
	var req = SpiraApiUtil_GetSpiraRequest("GET", query);
	req.SetParameter('project_id', projectId);
	
	var response = req._DoExecute();
	
	if(response.status)
	{
		var folders = req.GetResponseBodyObject();
		return folders;
	} else {
		SpiraApiUtil_LogError('Faield to load document folders in project: ' + projectId);
		return false;
	}
}

function SpiraUtil_GetTestSetsByIds(projectId, testSetIds)
{
	var testSets = [];
	
	for(var i = 0; i < testSetIds.length; i++)
	{
		var testSetId = testSetIds[i];
		var testSet = SpiraUtil_GetTestSetById(projectId, testSetId);
		if (testSet)
		{
			testSets.push(testSet);
		}
	}
	
	return testSets;
}

function SpiraUtil_GetTestSetById(projectId, testSetId)
{
	var query = "projects/{project_id}/test-sets/{test_set_id}";

	var req = SpiraApiUtil_GetSpiraRequest("GET", query);
	req.SetParameter('project_id', projectId);
	req.SetParameter('test_set_id', testSetId);
	
	var response = req._DoExecute();
	
	if(response.status)
	{
		var testSet = req.GetResponseBodyObject();
		return testSet;
	} else {
		SpiraApiUtil_LogError('Failed to get test set by id: ' + testSetId);
		return false;
	}	
}

function SpiraUtil_GetTestSetsExecutedToday(projectId, releaseId)
{
	var query = "projects/{project_id}/test-sets/search?starting_row=1&number_of_rows=1000&release_id={release_id}";
	
	var date =  UtilGetPaddedZeroesDate(new Date());
	
	var postData = [{"PropertyName" : "ExecutionDate", "DateRangeValue" : {"StartDate": date + "T00:00:00", "EndDate": date + "T23:59:59"}}];
	
	var req = SpiraApiUtil_GetSpiraRequest("POST", query);
	req.SetParameter('project_id', projectId);
	req.SetParameter('release_id', releaseId);
	req.SetRequestBodyObject(postData);
	
	var response = req._DoExecute();
	
	if(response.status)
	{
		var testSets = req.GetResponseBodyObject();
		return testSets;
	} else {
		SpiraApiUtil_LogError('Test set query failed in project: ' + projectId);
		return false;
	}
}

function SpiraUtil_GetLatestTestRunForTestSet(testSet)
{
	var query = "projects/{project_id}/test-runs/search/automated?starting_row=1&number_of_rows=1";
	var postData = [
		{
			"PropertyName": "TestSetId",
			"IntValue": testSet.TestSetId
		}
	]

	var req = SpiraApiUtil_GetSpiraRequest("POST", query);
	req.SetParameter('project_id', testSet.ProjectId);
	req.SetRequestBodyObject(postData);

	var response = req._DoExecute();
	
	if(response.status)
	{
		var testRuns = req.GetResponseBodyObject();
		return testRuns[0];
	} else {
		SpiraApiUtil_LogError('Failed to query latest test run for Test Set: ' + testSet.TestSetId);
		return false;
	}
}

function SpiraUtil_GetLatestTestRunForTestCaseMapping(projectId, testCaseMapping)
{
	var query = "projects/{project_id}/test-runs/search/automated?starting_row=1&number_of_rows=1";
	var postData = [
		{
			"PropertyName": "TestSetTestCaseId",
			"IntValue": testCaseMapping.TestSetTestCaseId
		}
	]

	var req = SpiraApiUtil_GetSpiraRequest("POST", query);
	req.SetParameter('project_id', projectId);
	req.SetRequestBodyObject(postData);

	var response = req._DoExecute();
	
	if(response.status)
	{
		var testRuns = req.GetResponseBodyObject();
		return testRuns[0];
	} else {
		SpiraApiUtil_LogError('Failed to query latest test run for Test Case Mapping: ' + testSet.TestSetTestCaseId);
		return false;
	}
}

function SpiraUtil_GetRelatedTestRunsFor(testRun)
{
	var runnerTestName = testRun.RunnerTestName;
	var marker = "#metadata:";
	var pos = runnerTestName.indexOf(marker);
	if (pos != -1)
	{
		var metadata = runnerTestName.substr(pos + marker.length);
		metadata = JSON.parse(metadata);
		var tag = metadata.tag;
		tag = tag.split("_")[0];

		var query = "projects/{project_id}/test-runs/search/automated?starting_row=1&number_of_rows=1000";
		var postData = [
			{
				"PropertyName": "RunnerTestName",
				"StringValue": "\"tag\":\"" + tag
			}
		]
		
		var req = SpiraApiUtil_GetSpiraRequest("POST", query);
		req.SetParameter('project_id', testRun.ProjectId);
		req.SetRequestBodyObject(postData);
		
		var response = req._DoExecute();
		
		if(response.status)
		{
			var testRuns = req.GetResponseBodyObject();
			return testRuns;
		} else {
			SpiraApiUtil_LogError('Failed to query related test runs for Test Run: ' + testRun.TestRunId);
			return false;
		}
	}

	return null;
}

function SpiraUtil_ExtractTestRunParameters(log)
{
	if (!log)
	{
		return "";
	}
	
	var _separator = "======= ======";
	var _pos1 = log.indexOf(_separator);
	var _pos2 = log.indexOf("g_spiraConfigPath");
	
	if (_pos1 > 0 && _pos2 > _pos1)
	{
		var _paramStr = log.substring(_pos1 + _separator.length, _pos2);
		var _params = _paramStr.split("\n");
		var _result = "";
		for(var _p = 0; _p < _params.length; _p++)
		{
			var _kv = Global.DoTrim(_params[_p]);
			if (_kv)
			{
				if (_kv.indexOf("g_enableVideoRecording") == 0 || _kv.indexOf("g_verboseLevel") == 0)
				{
					continue;
				}
			
				if (_result) _result += ", ";
				_result += _kv;
			}
		}
		
		return _result;
	}
	return ""; 
}

function SpiraUtil_GetTestRunFailureDetails(testRun, withScreenshots)
{
	// Read steps
	var query = "projects/{project_id}/test-runs/{test_run_id}/automated";
	var req = SpiraApiUtil_GetSpiraRequest("GET", query);
	req.SetParameter('project_id', testRun.ProjectId);
	req.SetParameter("test_run_id", testRun.TestRunId);

	var response = req._DoExecute();
	
	if(response.status)
	{
		testRun = req.GetResponseBodyObject();
	} else {
		SpiraApiUtil_LogError('Failed to query Test Run by id: ' + testRun.TestRunId);
		return "";
	}

	var lastImage = null;
	var details = "";
	var firstFailure = true;
	for(var i = 0; i < testRun.TestRunSteps.length; i++)
	{
		var step = testRun.TestRunSteps[i];
		if (step.ExecutionStatusId == 1)
		{
			if (!firstFailure)
			{
				details += step.Description + ", ";
			}
			else
			{
				firstFailure = false;
			}
		}
		
		if (withScreenshots)
		{
			if (("" + step.ActualResult).indexOf("rapise_report_embedded_image") != -1)
			{
				lastImage = step.ActualResult;
			}
		}
	}
	
	if (!details)
	{
		details = testRun.RunnerMessage;
	}

	details = details.replace(/<[^>]*>/g, '');
	if (lastImage)
	{
		details += "<br/><br/>\r\n\r\n" + lastImage + "<br/>";
	}
	
	return details;
}
