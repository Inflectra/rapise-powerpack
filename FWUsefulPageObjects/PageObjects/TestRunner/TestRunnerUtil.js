const TestRunnerUtil = 
{
	CheckCompatibility()
	{
		if (!Global.GetRapiseVersion("8.4"))
		{
			Tester.Assert("TestRunner requires Rapise 8.4+", false);
		}
		if (WScript.Version != "NODE" && WScript.Version != "NODE.WIN32")
		{
			Tester.Assert("TestRunner does not support WScript JavaScript engine.");
		}
		if (!File.Exists("PageObjects\\AiTester\\AiTester.js"))
		{
			Tester.Assert("TestRunner requires AiTester module. Please install it as well.");
		}
	},

	Init()
	{
		if (!File.FolderExists(g_workDir + "\\node_modules"))
		{
			const npmCmd = g_helper.ResolvePath("InstrumentJS/npm.cmd");
			const result = g_util.Run(`"${npmCmd}" install --prefix "${g_workDir}"`, `${g_workDir}\\PageObjects\\TestRunner`);
			Log(result);
		}
		
		const d3FilePath = TestRunnerSettings.GetDataPath("d3.js");
		if (!File.Exists(d3FilePath))
		{
			File.Copy("PageObjects\\TestRunner\\d3.js", d3FilePath);
		}
	},
	
	FormatTime(duration) 
	{
		const minutes = Math.floor(duration / 60000);
		const seconds = Math.floor((duration % 60000) / 1000);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	},

	GetExecutionStatusName(id)
	{
		if (id == 1) {
			return "Failed";
		} else if (id == 2) {
			return "Passed";
		} else if (id == 5) {
			return "Blocked";
		} else if (id == 6) {
			return "Caution";
		}
		return "Unknown";
	},
	
	GetTestRunFailureDetails(projectId, tr)
	{
		if (tr.TestRunSteps == null)
		{
			tr = SpiraUtil.GetTestRun(projectId, tr.TestRunId);
		}
	
		let details = "";
		
		if (tr.TestRunSteps && tr.TestRunSteps.length)
		{
			let firstFailure = true;
			for(let i = 0; i < tr.TestRunSteps.length; i++)
			{
				const step = tr.TestRunSteps[i];
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
			}
		}
		
		if (!details)
		{
			details = tr.RunnerMessage;
		}
		else
		{
			details = "Failed: " + details;
		}
		
		return details ? details.replace(/<[^>]*>/g, '') : "";
	},
	
	GetTestRunDetails(projectId, tr)
	{
		if (tr.ExecutionStatusId == 1)
		{
			// failed
			return this.GetTestRunFailureDetails(projectId, tr);
		}
		else if (tr.ExecutionStatusId == 5)
		{
			// blocked
			// return tr.RunnerMessage;
			return this.GetTestRunFailureDetails(projectId, tr);
		}
		return "";
	},
	
	GetDuration(startDateStr, endDateStr) 
	{
		const startDate = new Date(startDateStr);
		const endDate = new Date(endDateStr);
		const differenceInMilliseconds = endDate - startDate;
		const differenceInSeconds = Math.floor(differenceInMilliseconds / 1000);
		const minutes = Math.floor(differenceInSeconds / 60);
		const seconds = differenceInSeconds % 60;
		const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
		return formattedDuration;
	},
	
	FirstLineContainsComma(multilineString) 
	{
		const lines = multilineString.split(/\r?\n/);
		if (lines.length === 0) {
			return false;
		}
		const firstLine = lines[0];
		return firstLine.includes(',');
	},
	
	SanitizeString(str)
	{
		if (!str)
		{
			return "";
		}
		
		str = str.replace(/,/g, " ");
		str = str.replace(/[/]/g, "\\");		
		str = str.replace(/\r\n/g, " ");
		str = str.replace(/\n/g, " ");
		return str;
	},
	
	/**
	 * Converts TRP report into JSONL format.
	 */
	ConvertTrpToJsonl(path, outputPath)
	{
		var ldr = new ActiveXObject("Rapise.LogLoader");
		ldr.LoadTrp(path);
		if (!ldr.ExportAsJsonl(outputPath, true /*embed images*/))
		{
			Log(ldr.ExportErrors);
			return false;
		}
		return true;
	},
	
	DefaultPromptLocation: "PageObjects\\TestRunner\\Prompts",
	
	BuildPrompt(query, baseName)
	{
		const data = File.Read(TestRunnerSettings.GetDataPath(`Selected${baseName}.txt`));
	
		const prompt1 = 
`Analyze these test runs. Format of the data is 

TestSet/TestCase
Runs
...

Runs have the following structure

Timestamp,Duration,Status[,ErrorDescription]
...

Status can be P - Passed, F - Failed, B - Blocked, C - Caution.
Duration is minutes:seconds.

${query}

${data}
`;

		const prompt2 = 
`
Analyze these test runs. Format of the data is 

TestSetName/TestCaseName,Timestamp,Duration,Status[,ErrorDescription]
...

Status can be P - Passed, F - Failed, B - Blocked, C- Caution.
Duration is minutes:seconds.

${query}

${data}
`;

		const prompt = TestRunnerUtil.FirstLineContainsComma(data) ? prompt2 : prompt1;
		return prompt;
	},
	
	BuildPromptPy(query, baseName, promptFileName)
	{
		const inputDataFile = TestRunnerSettings.GetDataPath(`Selected${baseName}.txt`);
		if (!promptFileName)
		{
			const data = File.Read(inputDataFile);
			promptFileName = TestRunnerUtil.FirstLineContainsComma(data) ? `${this.DefaultPromptLocation}\\PromptPyHistoryGraph.txt` : `${this.DefaultPromptLocation}\\PromptPyFlakyGraph.txt`;
		}
		if (File.Exists(promptFileName))
		{
			let prompt = File.Read(`${promptFileName}`);
			prompt = prompt.replace("SelectedTestRunInfo", `Selected${baseName}`);
			return `${prompt}\n${query}`;
		}
		Tester.Assert(`${promptFileName} does not exist`, false);
		return null;
	},
	
	BuildPromptHtml(query, baseName, promptFileName)
	{
		const inputDataFile = TestRunnerSettings.GetDataPath(`Selected${baseName}.txt`);
		if (!promptFileName)
		{
			const data = File.Read(inputDataFile);
			promptFileName = TestRunnerUtil.FirstLineContainsComma(data) ? `${this.DefaultPromptLocation}\\PromptHtmlHistoryGraph.txt` : `${this.DefaultPromptLocation}\\PromptHtmlFlakyGraph.txt`;
		}
		if (File.Exists(promptFileName))
		{
			let prompt = File.Read(`${promptFileName}`);
			prompt = prompt.replace("SelectedTestRunInfo", `Selected${baseName}`);
			return `${prompt}\n${query}`;
		}
		Tester.Assert(`${promptFileName} does not exist`, false);
		return null;
	},
	
	/**
	 * Discovers test sets. If `failedAndNotRunOnly` flag is `true` then only not executed or failed test sets are processed. Discovered test sets are passed to the callback function.
	 * @param rvlPath Path to RVL script that triggers Spira.RunTestSet actions.
	 * @param failedAndNotRunOnly If `true` then only failed and not run test sets will be processed, if `false` then all test sets are discovered.
	 * @param callback Function that will receive (testSetId, hostToken, projectId, failed) parameters.
	 */
	DiscoverTestSets(/**string*/ rvlPath, /**boolean*/ failedAndNotRunOnly, /**function*/ callback)
	{
		const fullRvlPath = g_helper.ResolveEnvironmentVariables(rvlPath);
		const sw = new ActiveXObject("SeSWrappers.Utils.SpreadsheetWrapper");
		const res = sw.Open(fullRvlPath);
		const sheetNames = [];
		for(let i = 0; i < sw.GetSheetCount(); i++)
		{
			const n = sw.GetSheetName(i);
			sheetNames.push(n);
		}
		sw.Close();
		
		const testSetExecutionInfo = {};
		const projectInfo = {};
		
		for(let sheetInd = 0; sheetInd < sheetNames.length; sheetInd++)
		{
			const sheet = sheetNames[sheetInd];
			const resObj = {};
			if(RVL.DoParseScript(rvlPath, sheet, undefined, undefined, resObj))
			{
				for(let i = 1; i < resObj.ctx.script.Rows.length; i++)
				{
					const row = resObj.ctx.script.Rows[i];
					if (row.Action && row.Action == "RunTestSet")
					{
						let testSetId = row.ParamValue;
						if (row.ParamType == "number")
						{
							testSetId = parseInt(testSetId);
						}
						let hostToken = "";
						if ((i + 1) < resObj.ctx.script.Rows.length && resObj.ctx.script.Rows[i + 1].Type == "Param")
						{
							hostToken = resObj.ctx.script.Rows[i + 1].ParamValue;
						}
						hostToken = hostToken || Spira.GetHostToken();
						let projectId = "";
						if ((i + 2) < resObj.ctx.script.Rows.length && resObj.ctx.script.Rows[i + 2].Type == "Param")
						{
							projectId = resObj.ctx.script.Rows[i + 2].ParamValue;
							if (resObj.ctx.script.Rows[i + 2].ParamType == "number")
							{
								projectId = parseInt(projectId);
							}
						}
						projectId = Spira.GetProjectId(projectId);
						
						//Tester.Message("PR: " + projectId + ", TS: " + testSetId + ", HOST: " + hostToken);
						
						if (!testSetExecutionInfo[projectId])
						{
							testSetExecutionInfo[projectId] = SpiraUtil.GetTestSetsExecutedToday(projectId);
							projectInfo[projectId] = Spira.GetProjectById(projectId);
						}
						
						const executedTestSets = testSetExecutionInfo[projectId];
						
						let testSetWasExecuted = false;
						for(let tsInd = 0; tsInd < executedTestSets.length; tsInd++)
						{
							const testSet = executedTestSets[tsInd];
							if (testSet.TestSetId == testSetId || testSet.Name == testSetId)
							{
								testSetWasExecuted = true;
								const testSetFailed = testSet.CountFailed || testSet.CountBlocked || testSet.CountNotRun;
								
								if (failedAndNotRunOnly && testSetFailed)
								{
									Tester.Message("Test Set failed: " + projectInfo[projectId].Name + "/" + testSet.Name);
								}
								
								if ((failedAndNotRunOnly && testSetFailed) || !failedAndNotRunOnly)
								{
									callback(testSetId, hostToken, projectId, testSetFailed);
								}
							}
						}
						
						if (!testSetWasExecuted)
						{
							Tester.Message("Test Set was not executed: " + projectInfo[projectId].Name + "/" + testSetId);
							callback(testSetId, hostToken, projectId, false);
						}
					}
				}
			}
		}
	},
	
	StringifyTestRunArray(testRuns) 
	{
		const jsonl = testRuns.map(item => JSON.stringify(item)).join("\n");
		return jsonl;
	},
	
	ProcessJsonlInChunks(filePath, chunkSizeInMB, processJsonObject) {
	
		const fs = require('fs');
		const { StringDecoder } = require('string_decoder');
	
		const chunkSizeInBytes = chunkSizeInMB * 1024 * 1024;
		const decoder = new StringDecoder('utf8');
		
		try
		{
			const fd = fs.openSync(filePath, 'r');
		
			let buffer = Buffer.alloc(chunkSizeInBytes);
			let bytesRead = 0;
			let leftover = '';
			let lineNumber = 0;
		
			while ((bytesRead = fs.readSync(fd, buffer, 0, chunkSizeInBytes, null)) > 0) 
			{
				let chunk = decoder.write(buffer.slice(0, bytesRead));
				let lines = (leftover + chunk).split('\n');
		
				leftover = lines.pop(); // Save incomplete line for next chunk
		
				for (const line of lines) 
				{
					lineNumber++;
					if (!line.trim()) continue; // Skip empty lines
					try 
					{
						const jsonObject = JSON.parse(line);
						processJsonObject(jsonObject); // Process each object synchronously
					} 
					catch (error) 
					{
						Log(`Error parsing JSON on line ${lineNumber}: ${error}`);
						Log(`Bad line: ${line}`);
					}
				}
			}
		
			// Process any remaining data in `leftover`
			if (leftover.trim()) 
			{
				lineNumber++;
				try 
				{
					const jsonObject = JSON.parse(leftover);
					processJsonObject(jsonObject);
				} 
				catch (error) 
				{
					Log(`Error parsing JSON on line ${lineNumber}: ${error}`);
					Log(`Bad line: ${leftover}`);
				}
			}
		
			fs.closeSync(fd); // Close file descriptor
			Log("Finished processing the file.");
		
		} 
		catch (error) 
		{
			Log(`An error occurred: ${error}`);
		}
	},
	
	QueryRunHistory(/**number*/ projectId, /**number*/ count, /**number*/ batchSize, /**string*/ jsonlFileName)
	{
		const ofn = jsonlFileName;
		// distill, let's leave only those properties that we need
		const fields = [/*"RunnerMessage",*/ "TestRunId", "Name", "TestCaseId", "ExecutionStatusId", "TestSetId", "StartDate", "EndDate"];
	
		// start timer
		const startTime = Date.now();
	
		// start the output file
		File.Write(ofn, "");
	
		let totalLengthInBytes = 0;
		const testRunsCount = SpiraUtil.GetTestRuns(projectId, count, batchSize, fields, (testRuns, lengthInBytes) => {
			if (lengthInBytes)
			{
				totalLengthInBytes += typeof(lengthInBytes) == "number" ? lengthInBytes: parseInt(lengthInBytes);
			}
		
			// Convert the filtered page to a JSONL string and write to the file
			const content = TestRunnerUtil.StringifyTestRunArray(testRuns);
			File.Append(ofn, content);
			File.Append(ofn, "\n");
		
		});
		
		const endTime = Date.now();
		const duration = endTime - startTime;
		Tester.Message(`${testRunsCount} records processed`);
		Tester.Message(`TestRun fetch time: ${TestRunnerUtil.FormatTime(duration)}`);
	
		const speed = (testRunsCount/(duration/1000)).toFixed(2);
		Log(`${testRunsCount} record(s) loaded in ${duration/1000} seconds, size is ${totalLengthInBytes} bytes, ${speed} records/second`);	
	},

	BuildTestRunInfo(projectId, jsonlFileName, failuresOnly)
	{
		// start timer
		const startTime = Date.now();
	
		const testRunInfo = { TestRuns: [] };

		let processedFailureCount = 0;
		TestRunnerUtil.ProcessJsonlInChunks(jsonlFileName, 1, testRun => {

			if (TestRunnerSettings.ParamExcludeFromAnalysis[testRun.Name])
			{
				return;
			}
			
			if (failuresOnly && testRun.ExecutionStatusId == 2)
			{
				//skip passed
				return;
			}
		
			const ts = SpiraUtil.GetTestSet(projectId, testRun.TestSetId);
			const fullName = ts.Name + "/" + testRun.Name;
			const reason = TestRunnerUtil.GetTestRunDetails(projectId, testRun)
			const ptr = { "Name": fullName, "StartDate": testRun.StartDate, "EndDate": testRun.EndDate, "Duration": TestRunnerUtil.GetDuration(testRun.StartDate, testRun.EndDate), "Status": TestRunnerUtil.GetExecutionStatusName(testRun.ExecutionStatusId), "Reason" : reason };
			testRunInfo.TestRuns.push(ptr);
			
			if (testRun.ExecutionStatusId != 2)
			{
				processedFailureCount++;
			}
		});
		
		const endTime = Date.now();
		const duration = endTime - startTime;
		Tester.Message(`Processed ${processedFailureCount} failures`);
		Tester.Message(`${testRunInfo.TestRuns.length} records processed`);
		Tester.Message(`TestRun details fetch time: ${TestRunnerUtil.FormatTime(duration)}`);	
		
		return testRunInfo;
	},

	DiscoverFlakyTestCases(jsonlFileName)
	{
		const stats = {};
		
		function buildExecutionStatusCounts(testRun) 
		{
			const { TestCaseId, TestSetId, Name, ExecutionStatusId } = testRun;
		
			// Initialize the test case entry if it doesn't exist
			if (!stats[TestCaseId]) {
				stats[TestCaseId] = { TestSetId, Name, Total: 0, Counts: { Passed: 0, Failed: 0, Blocked: 0, Unknown: 0 }, TestRuns: [] };
			}
			
			stats[TestCaseId].TestRuns.push(testRun);
			stats[TestCaseId].Total++;
			if (ExecutionStatusId == 1) {
				stats[TestCaseId].Counts.Failed++;
			} else if (ExecutionStatusId == 2) {
				stats[TestCaseId].Counts.Passed++;
			} else if (ExecutionStatusId == 5) {
				stats[TestCaseId].Counts.Blocked++;
			} else {
				stats[TestCaseId].Counts.Unknown++;
			}
		}
		
		TestRunnerUtil.ProcessJsonlInChunks(jsonlFileName, 1, buildExecutionStatusCounts);

		const testCaseArray = Object.entries(stats).map(([TestCaseId, data]) => ({
			TestCaseId: parseInt(TestCaseId, 10), // Convert key back to number
			TestSetId: data.TestSetId,
			Name: data.Name,
			Total: data.Total,
			Counts: data.Counts,
			TestRuns: data.TestRuns
		}));
		
		testCaseArray.map((item) => {
			item.SuccessRate = item.Counts.Passed * 1.0 / item.Total;
		});
	
		testCaseArray.sort((a, b) => a.SuccessRate - b.SuccessRate);
		return testCaseArray;
	},

	BuildTestCaseRunInfo(projectId, testCaseArray, maxTestCases)
	{
		maxTestCases = maxTestCases || 100;
		function processTestCases(maxCount, callback)
		{
			for(let i = 0; i < maxCount && i < testCaseArray.length; i++)
			{
				const tc = testCaseArray[i];
				
				if (tc.SuccessRate == 1)
				{
					break;
				}
				
				if (TestRunnerSettings.ParamExcludeFromAnalysis[tc.Name] || tc.Total < TestRunnerSettings.ParamMinNumberOfTestRuns)
				{
					maxCount++;
					continue;
				}
				
				callback(tc);
			}
		}
		
		let totalFailureCount = 0;
		processTestCases(maxTestCases, tc => {
			totalFailureCount += (tc.Total - tc.Counts.Passed);
		});
		Tester.Message(`Total ${totalFailureCount} failures found`);
	
		let processedFailureCount = 0;
		const testRunInfo = { TestRuns: [] };
		processTestCases(maxTestCases, tc => {
			const ts = SpiraUtil.GetTestSet(projectId, tc.TestSetId);
			const fullName = ts.Name + "/" + tc.Name;
			Tester.Message(`${fullName}, pass rate is ${tc.SuccessRate.toFixed(2)} in ${tc.Total} runs`);
	
			tc.TestRuns.forEach(testRun => {
				const reason = TestRunnerUtil.GetTestRunDetails(projectId, testRun)
				const tr = { "Name": fullName, "StartDate": testRun.StartDate, "EndDate": testRun.EndDate, "Duration": TestRunnerUtil.GetDuration(testRun.StartDate, testRun.EndDate), "Status": TestRunnerUtil.GetExecutionStatusName(testRun.ExecutionStatusId), "Reason" : reason };
				testRunInfo.TestRuns.push(tr);
				
				if (testRun.ExecutionStatusId != 2)
				{
					processedFailureCount++;
					
					if (processedFailureCount % 100 == 0)
					{
						Tester.Message(`Processed ${processedFailureCount} failures of ${totalFailureCount}`);
					}
				}
			});
		});
		
		return testRunInfo;
	},

	DistillSelectedTestRunInfoPlain(baseName)
	{
		let lineCount = 0;
		const jsonFileName = TestRunnerSettings.GetDataPath(`Selected${baseName}.json`);
		const testRunInfo = JSON.parse(File.Read(jsonFileName));
		const fn = TestRunnerSettings.GetDataPath(`Selected${baseName}.txt`);
		File.Write(fn, "");
		const fnjs = TestRunnerSettings.GetDataPath(`Selected${baseName}.js`);
		File.Write(fnjs, "var inputData = [\n");
		testRunInfo.TestRuns.forEach(testRun => {
			const name = TestRunnerUtil.SanitizeString(testRun.Name).replace("\\", "/");
			const startDate = testRun.StartDate.slice(0, -5);
			const status = testRun.Status[0];
			let reason = testRun.Reason.startsWith("Failed: ") ? testRun.Reason.slice(8) : testRun.Reason;
			reason = TestRunnerUtil.SanitizeString(reason);
			let line = `${name},${startDate},${testRun.Duration},${status},${reason}`;
			if (line.endsWith(","))
				line = line.slice(0, -1);
			File.Append(fn, `${line}\n`);
			File.Append(fnjs, `\`${line}\`,\n`);
			lineCount++;
		});
		File.Append(fnjs, "];");
		return lineCount;
	},

	DistillSelectedTestRunInfo(baseName)
	{
		const jsonFileName = TestRunnerSettings.GetDataPath(`Selected${baseName}.json`);
		const testRunInfo = JSON.parse(File.Read(jsonFileName));
		const fn = TestRunnerSettings.GetDataPath(`Selected${baseName}.txt`);
		File.Write(fn, "");
		const fnjs = TestRunnerSettings.GetDataPath(`Selected${baseName}.js`);
		File.Write(fnjs, "var inputData = [\n");
		let lastTestRunName = "";
		testRunInfo.TestRuns.forEach(testRun => {
			if (testRun.Name != lastTestRunName)
			{
				lastTestRunName = testRun.Name
				File.Append(fn, `${lastTestRunName}\n`);
				File.Append(fnjs, `\`${lastTestRunName}\`,\n`);
			}
			const startDate = testRun.StartDate.slice(0, -5);
			const status = testRun.Status[0];
			let reason = testRun.Reason.startsWith("Failed: ") ? testRun.Reason.slice(8) : testRun.Reason;
			reason = TestRunnerUtil.SanitizeString(reason);
			let line = `${startDate},${testRun.Duration},${status},${reason}`.trim();
			if (line.endsWith(","))
				line = line.slice(0, -1);
			File.Append(fn, `${line}\n`);
			File.Append(fnjs, `\`${line}\`,\n`);
		});
		File.Append(fnjs, "];");
	}
}