const SpiraUtil = 
{
	GetTestSetsExecutedToday(projectId, releaseId)
	{
		const query = "projects/{project_id}/test-sets/search?starting_row=1&number_of_rows=1000&release_id={release_id}";
		const date =  UtilGetPaddedZeroesDate(new Date());
		const postData = [{"PropertyName" : "ExecutionDate", "DateRangeValue" : {"StartDate": date + "T00:00:00", "EndDate": date + "T23:59:59"}}];
		
		const req = SpiraApiUtil_GetSpiraRequest("POST", query);
		req.SetParameter('project_id', projectId);
		req.SetParameter('release_id', releaseId);
		req.SetRequestBodyObject(postData);
		
		const response = req._DoExecute();
		
		if(response.status)
		{
			const testSets = req.GetResponseBodyObject();
			return testSets;
		} else {
			SpiraApiUtil_LogError('Test set query failed in project: ' + projectId);
			return false;
		}
	},
	
	GetTestSetsByIds(projectId, testSetIds)
	{
		const testSets = [];
		
		for(var i = 0; i < testSetIds.length; i++)
		{
			const testSetId = testSetIds[i];
			let testSet = null;
			if (typeof(testSetId) == "number" || !isNaN(testSetId-0))
			{
				testSet = SpiraUtil.GetTestSetById(projectId, testSetId);
			}
			else
			{
				testSet = SpiraUtil.GetTestSetByName(projectId, testSetId);
			}
			
			if (testSet)
			{
				testSets.push(testSet);
			}
		}
		
		return testSets;
	},
	
	GetTestSetById(projectId, testSetId)
	{
		const query = "projects/{project_id}/test-sets/{test_set_id}";
	
		const req = SpiraApiUtil_GetSpiraRequest("GET", query);
		req.SetParameter('project_id', projectId);
		req.SetParameter('test_set_id', testSetId);
		
		const response = req._DoExecute();
		
		if(response.status)
		{
			const testSet = req.GetResponseBodyObject();
			return testSet;
		} else {
			SpiraApiUtil_LogError('Failed to get test set by id: ' + testSetId);
			return false;
		}
	},
	
	GetTestSetByName(projectId, name)
	{
		const req = SpiraApiUtil_GetSpiraRequest("POST", "projects/{project_id}/test-sets/search?starting_row=0&number_of_rows=5");

		req.SetParameter('project_id', projectId);
		req.SetRequestBodyObject(	[
		{
			"PropertyName": "Name",
			"StringValue": name
		}
		]);
		
		let ts = null;
		const res = req._DoExecute();
		if(res.status)
		{
			const testSets = req.GetResponseBodyObject();
			if (testSets.length == 1)
			{
				ts = req.GetResponseBodyObject()[0];
				return ts;
			}
			else if (testSets.length > 1)
			{
				SpiraApiUtil_LogError(`Test set: ${name} is not unique in project ${projectId}`);
				return null;
			}
		}

		SpiraApiUtil_LogError(`Test set: ${name} is not found in project ${projectId}`);
		return null;
	},

	GetTestSetTestCaseMapping(projectId, testSetId)
	{
		const query = "projects/{project_id}/test-sets/{test_set_id}/test-case-mapping";
		const req = SpiraApiUtil_GetSpiraRequest("GET", query);
		req.SetParameter('project_id', projectId);
		req.SetParameter('test_set_id', testSetId);
		
		const response = req._DoExecute();
		
		if(response.status)
		{
			const mappings = req.GetResponseBodyObject();
			return mappings;
		} else {
			SpiraApiUtil_LogError('Test set mapping query failed in project: ' + projectId);
			return false;
		}
	},

	GetLatestRunForTestCase(projectId, testCaseId)
	{
		const query = "projects/{project_id}/test-runs/search?starting_row=1&number_of_rows=1&sort_field=TestRunId&sort_direction=desc";
		const postData = [{"PropertyName" : "TestCaseId", "IntValue" : testCaseId}];
		
		const req = SpiraApiUtil_GetSpiraRequest("POST", query);
		req.SetParameter('project_id', projectId);
		req.SetRequestBodyObject(postData);
			
		const response = req._DoExecute();
		
		if(response.status)
		{
			const testRun = req.GetResponseBodyObject();
			return testRun;
		} else {
			SpiraApiUtil_LogError('Test run query failed in project: ' + projectId);
			return false;
		}
	},

	GetTestRunAttachments(projectId, testRunId)
	{
		const query = "projects/{project_id}/artifact-types/{artifact_type_id}/artifacts/{artifact_id}/documents";
		
		const req = SpiraApiUtil_GetSpiraRequest("GET", query);
		req.SetParameter('project_id', projectId);
		req.SetParameter('artifact_type_id', 5);
		req.SetParameter('artifact_id', testRunId);
		
		const response = req._DoExecute();
		
		if(response.status)
		{
			const attachments = req.GetResponseBodyObject();
			return attachments;
		} else {
			SpiraApiUtil_LogError('Attachments query failed in project: ' + projectId);
			return false;
		}
	},

	LoadTrpDocument(projectId, documentId)
	{
		const query = "projects/{project_id}/documents/{document_id}/open";
		
		const req = SpiraApiUtil_GetSpiraRequest("GET", query);
		req.SetParameter('project_id', projectId);
		req.SetParameter('document_id', documentId);
		
		const response = req._DoExecute();
		
		if(response.status)
		{
			const data = req.GetResponseBodyObject();
			return data;
		} else {
			SpiraApiUtil_LogError('Document open query failed in project: ' + projectId);
			return false;
		}
	},
	
	GetDocumentTypes(projectTemplateId)
	{
		const query = "project-templates/{project_template_id}/document-types?active_only=true";

		const req = SpiraApiUtil_GetSpiraRequest("GET", query);
		req.SetParameter('project_template_id', projectTemplateId);

		const response = req._DoExecute();

		if(response.status)
		{
			const documentTypes = req.GetResponseBodyObject();
			return documentTypes;
		} else {
			SpiraApiUtil_LogError('Document types query failed for project template: ' + projectTemplateId);
			return false;
		}
	},
	
	UploadDocument(projectId, documentFolderId, documentTypeId, path)
	{
		const query = `projects/${projectId}/documents/file`;

		const fileName = path.split('\\').pop().split('/').pop();
		const fs = require('fs');
		const fileData = fs.readFileSync(path);
		const base64String = fileData.toString('base64');

		const postData = 
		{
			BinaryData: base64String,
			AttachmentTypeId: 1,
			DocumentTypeId: documentTypeId,
			ProjectAttachmentFolderId: documentFolderId,
			AttachedArtifacts: [],
			FilenameOrUrl: fileName,
			ProjectId: projectId,
		};
		
		const req = SpiraApiUtil_GetSpiraRequest("POST", query);
		req.SetParameter('project_id', projectId);
		req.SetRequestBodyObject(postData);
		
		const response = req._DoExecute();
		
		if(response.status)
		{
			const document = req.GetResponseBodyObject();
			if (document)
			{
				return document.AttachmentId;
			}
			else
			{
				return false;
			}
		} else {
			SpiraApiUtil_LogError('UploadDocument query failed in project: ' + projectId);
			return false;
		}
	},

	GetTestCase(projectId, testCaseId)
	{
		const query = "projects/{project_id}/test-cases/{test_case_id}";
		
		const req = SpiraApiUtil_GetSpiraRequest("GET", query);
		req.SetParameter('project_id', projectId);
		req.SetParameter('test_case_id', testCaseId);
		
		const response = req._DoExecute();
		
		if(response.status)
		{
			const tc = req.GetResponseBodyObject();
			return tc;
		} else {
			SpiraApiUtil_LogError('Test case query failed in project: ' + projectId);
			return false;
		}
	},

	testSetCache: {},

	GetTestSet(projectId, testSetId)
	{
		if (testSetId == null)
		{
			return {"Name" : "Undefined"};
		}

		if (this.testSetCache[testSetId])
		{
			return this.testSetCache[testSetId];
		}
		
		if(typeof(testSetId)=='number' || !isNaN(testSetId-0))
		{
			const query = "projects/{project_id}/test-sets/{test_set_id}";
			
			const req = SpiraApiUtil_GetSpiraRequest("GET", query);
			req.SetParameter('project_id', projectId);
			req.SetParameter('test_set_id', testSetId);
			
			const response = req._DoExecute();
			
			if(response.status)
			{
				const ts = req.GetResponseBodyObject();
				this.testSetCache[testSetId] = ts;
				return ts;
			} else {
				SpiraApiUtil_LogError('Test set query failed in project: ' + projectId);
				return false;
			}
		}
		else
		{
			const query = "projects/{project_id}/test-sets/search?starting_row=0&number_of_rows=5";
			const req = SpiraApiUtil_GetSpiraRequest("POST", query);
	
			req.SetParameter('project_id', projectId);
			req.SetRequestBodyObject([
				{
					"PropertyName": "Name",
					"StringValue": testSetId
				}
			]);
			var res = req._DoExecute();
			
			if( res.status && req.GetResponseBodyObject() && req.GetResponseBodyObject().length==1 )
			{
				const ts = req.GetResponseBodyObject()[0];
				this.testSetCache[testSetId] = ts;
				return ts;
			}
			else
			{
				SpiraApiUtil_LogError('Test set query failed in project: ' + projectId);
				return false;
			}
		}
	},

	GetTestRun(projectId, testRunId)
	{
		const query = "projects/{project_id}/test-runs/{test_run_id}/automated";
		
		if (TestRunnerSettings.TestRunTypeId == TestRunnerManualTestRunType)
		{
			query = "projects/{project_id}/test-runs/{test_run_id}/manual";
		}
		
		const req = SpiraApiUtil_GetSpiraRequest("GET", query);
		req.SetParameter('project_id', projectId);
		req.SetParameter('test_run_id', testRunId);
	
		const response = req._DoExecute();
	
		if (response.status)
		{
			const tr = req.GetResponseBodyObject();
			return tr;
		}
		else
		{
			SpiraApiUtil_LogError('Automated test run query failed in project: ' + projectId);
			return null;
		}
	},

	GetTestRunCount(projectId, days)
	{
		const query = "projects/{project_id}/test-runs/count";
		
		const postData = [{"PropertyName": "TestRunTypeId", "IntValue": TestRunnerSettings.TestRunTypeId}];
		
		if (days)
		{
			const d = new Date();
			const endDate =  UtilGetPaddedZeroesDate(d) + "T23:59:59";
			
			d.setDate(d.getDate() - days + 1);
			const startDate = UtilGetPaddedZeroesDate(d) + "T00:00:00";

			postData.push({"PropertyName": "StartDate", "DateRangeValue": {
				"EndDate": endDate,
				"StartDate": startDate
			}});
		}
	
		const req = SpiraApiUtil_GetSpiraRequest("POST", query);
		req.SetParameter('project_id', projectId);
		req.SetRequestBodyObject(postData);
	
		const response = req._DoExecute();
	
		if (response.status)
		{
			const count = req.GetResponseBodyObject();
			return count;
		}
		else
		{
			SpiraApiUtil_LogError('Test run query failed in project: ' + projectId);
			return 0;
		}
	},

	GetTestRuns(projectId, count, batchSize, fields, callback)
	{
		let batchNo = 1;
		let testRunsCount = 0;
		let startingRow = 1;
		
		const maxCount = TestRunnerSettings.ParamMaxNumberOfTestRuns;
		if (count > maxCount)
		{
			Tester.Message(`Max number of test runs to query is ${maxCount}. Changing ${count} to ${maxCount}.`);
			count = maxCount;
		}
		
		function _queryTestRunsFromServer(starting_row, number_of_rows)
		{
			AiServerClient.SpiraSetCredentials();
			const query = `projects/${projectId}/test-runs/search?starting_row=${starting_row}&number_of_rows=${number_of_rows}&sort_field=TestRunId&sort_direction=desc`;
			const postData = [{"PropertyName": "TestRunTypeId", "IntValue": TestRunnerSettings.TestRunTypeId}];
			
			const response = AiServerClient.SpiraSendRequest("POST", query, postData, fields);
			return { testRuns: response?.data?.result, lengthInBytes: response?.data?.metrics?.contentLength };
		}
	
		function _queryTestRuns(starting_row, number_of_rows)
		{
			const startTime = Date.now();
	
			const response = _queryTestRunsFromServer(starting_row, number_of_rows);
			const trs = response.testRuns;
			const lengthInBytes = response.lengthInBytes;
			
			const endTime = Date.now();
			const duration = (endTime - startTime) / 1000;
	
			if (trs)
			{
				const speed = (trs.length/duration).toFixed(2);
				Log(`Batch ${batchNo} of ${Math.ceil(count/batchSize)}: ${trs.length} record(s) loaded in ${duration} seconds, size is ${lengthInBytes} bytes, ${speed} records/second`);
				batchNo++;
				
				callback(trs, lengthInBytes);
				return trs.length;
			}
			else
			{
				SpiraApiUtil_LogError('Test run query failed in project: ' + projectId);
				return 0;
			}
		}
	
		// Loop to fetch data until we have the desired count or run out of data
		while (testRunsCount < count)
		{
			const remaining = count - testRunsCount;
			const rowsToFetch = Math.min(remaining, batchSize);
	
			const fetchedCount = _queryTestRuns(startingRow, rowsToFetch);
	
			if (fetchedCount === 0)
			{
				// No more data available, exit the loop
				break;
			}
	
			testRunsCount += fetchedCount;
			startingRow += fetchedCount; // Increment starting row for next batch
		}
	
		return testRunsCount;
	},
	
	GenerateReportForProject(projectId, testSetIds, model)
	{
		this.QueryExecutionStatus72(projectId, testSetIds, model);
	},
	
	QueryExecutionStatus72(projectId, testSetIds, model)
	{
		const project = Spira.GetProjectById(projectId);
		let testSets = [];
		if (testSetIds)
		{
			const testSetsToCheck = SpiraUtil.GetTestSetsByIds(projectId, testSetIds);
			const testSetsToday = SpiraUtil.GetTestSetsExecutedToday(projectId, null);
			for(let i = 0; i < testSetsToCheck.length; i++)
			{
				const tsToCheck = testSetsToCheck[i];
				for(let j = 0; j < testSetsToday.length; j++)
				{
					const tsToday = testSetsToday[j];
					if (tsToCheck.TestSetId == tsToday.TestSetId)
					{
						testSets.push(tsToCheck);
						break;
					}
				}
			}
		}
		else
		{
			testSets = SpiraUtil.GetTestSetsExecutedToday(projectId, null);
		}
		Tester.Message("Found Test Set count: " + testSets.length);
		
		model.testSets.push.apply(model.testSets, testSets);
	
		for(let i = 0; i < testSets.length; i++)
		{
			const testSet = testSets[i];
			
			testSet.projectName = project.Name;
			
			Tester.Message("Processing: " + testSet.projectName + "/" + testSet.Name);
			
			// Get test cases in test set
			// Load latest run for each such test case, it should be of specific date
			const testCaseMappings = SpiraUtil.GetTestSetTestCaseMapping(projectId, testSet.TestSetId);
			if (testCaseMappings)
			{
				let failed = 0;
				let passed = 0;
				let notrun = 0;
				let blocked = 0;
			
				testSet.testRuns= [];
			
				for(let j = 0; j < testCaseMappings.length; j++)
				{
					const testCaseMapping = testCaseMappings[j];
					const tr = SpiraUtil.GetLatestTestRunForTestCaseMapping(projectId, testCaseMapping);
					if (tr)
					{
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
					else
					{
						notrun++;
					}
				}
				
				testSet.executionStatus = { passed: passed, failed: failed, blocked: blocked, notrun: notrun };
			}
		}
	},
	
	GetLatestTestRunForTestCaseMapping(projectId, testCaseMapping)
	{
		const query = "projects/{project_id}/test-runs/search/automated?starting_row=1&number_of_rows=1";
		const postData = [
			{
				"PropertyName": "TestSetTestCaseId",
				"IntValue": testCaseMapping.TestSetTestCaseId
			}
		]
	
		const req = SpiraApiUtil_GetSpiraRequest("POST", query);
		req.SetParameter('project_id', projectId);
		req.SetRequestBodyObject(postData);
	
		const response = req._DoExecute();
		
		if(response.status)
		{
			const testRuns = req.GetResponseBodyObject();
			return testRuns[0];
		} else {
			SpiraApiUtil_LogError('Failed to query latest test run for Test Case Mapping: ' + testSet.TestSetTestCaseId);
			return false;
		}
	},
	
	ExtractTestRunParameters(log)
	{
		if (!log)
		{
			return "";
		}
		
		const _separator = "======= ======";
		const _pos1 = log.indexOf(_separator);
		const _pos2 = log.indexOf("g_spiraConfigPath");
		
		if (_pos1 > 0 && _pos2 > _pos1)
		{
			const _paramStr = log.substring(_pos1 + _separator.length, _pos2);
			const _params = _paramStr.split("\n");
			let _result = "";
			for(let _p = 0; _p < _params.length; _p++)
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
	},
	
	GetTestRunFailureDetails(testRun, withScreenshots)
	{
		// Read steps
		const query = "projects/{project_id}/test-runs/{test_run_id}/automated";
		const req = SpiraApiUtil_GetSpiraRequest("GET", query);
		req.SetParameter('project_id', testRun.ProjectId);
		req.SetParameter("test_run_id", testRun.TestRunId);
	
		const response = req._DoExecute();
		
		if(response.status)
		{
			testRun = req.GetResponseBodyObject();
		} else {
			SpiraApiUtil_LogError('Failed to query Test Run by id: ' + testRun.TestRunId);
			return "";
		}
	
		let lastImage = null;
		let details = "";
		let firstFailure = true;
		
		if (testRun.TestRunSteps)
		{
			for(let i = 0; i < testRun.TestRunSteps.length; i++)
			{
				const step = testRun.TestRunSteps[i];
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
	},
	
	OutputSummaryReportHtml(model, reportName)
	{
		const config = SpiraApiUtil_GetSpiraConfig();
		const serverUrl = config.SpiraServer;
		
		function ln(msg)
		{
			File.Append(fn, msg + "\r\n");
		}
		
		function createBackLink(projectId, itemType, itemId)
		{
			return serverUrl + projectId + "/" + itemType + "/" + itemId + ".aspx";
		}
		
		const fn = TestRunnerSettings.GetDataPath(`${reportName}.html`);
	
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
		ln('	  <th scope="col">Not Run</th>');
		ln('	</tr>');
		ln('  </thead>');
		ln('  <tbody>');
	
		let passed = 0;
		let failed = 0;
		let blocked = 0;
		let notrun = 0;
		
		for(let i = 0; i < model.testSets.length; i++)
		{
			const testSet = model.testSets[i];
			passed += testSet.executionStatus.passed;
			failed += testSet.executionStatus.failed;
			blocked += testSet.executionStatus.blocked;
			notrun += testSet.executionStatus.notrun;
		}
	
		ln('<tr>');
		ln('  <th scope="row">Total</th>');
		ln('  <td>&nbsp;</td>');
		ln('  <td><span style="color:green;font-size: large;">' + passed + '</span></td>');
		ln('  <td><span style="' + (failed > 0 ? "color:red;" : "") + 'font-size: large;">' + failed + '</span></td>');
		ln('  <td><span style="' + (blocked > 0 ? "color:red;" : "") + 'font-size: large;">' + blocked + '</span></td>');
		ln('  <td><span style="' + (notrun > 0 ? "color:red;" : "") + 'font-size: large;">' + notrun + '</span></td>');
		ln('</tr>');	
		
		for(let i = 0; i < model.testSets.length; i++)
		{
			const testSet = model.testSets[i];
	
			let color = "color:green";
			
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
			ln('  <td><span style="' + (testSet.executionStatus.notrun > 0 ? "color:red;" : "") + '">' + testSet.executionStatus.notrun + '</td>');
			ln('</tr>');
		}
		
		ln('  </tbody>');
		ln('</table>');	
		
		ln("");
		ln("<h2>Failed Test Cases</h2>");
		ln("");
		ln("<ul>");
		for(let i = 0; i < model.testSets.length; i++)
		{
			const testSet = model.testSets[i];
			for(let j = 0; j < testSet.testRuns.length; j++)
			{
				const testRun = testSet.testRuns[j];
				if (testRun.ExecutionStatusId != 2 /* passed */)
				{
					ln('<li><a target="_blank" href="' + createBackLink(testSet.ProjectId, "TestCase", testRun.TestCaseId) + '">' + testSet.projectName + "/" + testSet.Name + "/" + testRun.Name + "</a></li>");
				}
			}
		}
		ln("</ul>");
		ln("");
		ln("<h2>Failures</h2>");
		
		for(let i = 0; i < model.testSets.length; i++)
		{
			const testSet = model.testSets[i];
			for(let j = 0; j < testSet.testRuns.length; j++)
			{
				const testRun = testSet.testRuns[j];
				if (testRun.ExecutionStatusId != 2 /* passed */)
				{
					ln("");
					ln("<h3>" + testSet.projectName + "/" + testSet.Name + "/" + testRun.Name + "</h3>");
					ln("");
					ln('<a target="_blank" href="' + createBackLink(testSet.ProjectId, "TestRun", testRun.TestRunId) + '">Open test run</a>');
					ln("");
	
					ln("<h4>Parameters</h4>");
					ln("");
					
					const parameters = SpiraUtil.ExtractTestRunParameters(testRun.RunnerStackTrace); 
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
					let failureDescription = "";
					
					if (testRun.ExecutionStatusId == 1)
					{ // failed
						 failureDescription = SpiraUtil.GetTestRunFailureDetails(testRun, true);
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
		for(let i = 0; i < model.testSets.length; i++)
		{
			const testSet = model.testSets[i];
		
			ln("<li>")
				ln(testSet.projectName + "/" + testSet.Name);
				ln("<ul>");
				for(let j = 0; j < testSet.testRuns.length; j++)
				{
					const testRun = testSet.testRuns[j];
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
		return fn;
	}
}
