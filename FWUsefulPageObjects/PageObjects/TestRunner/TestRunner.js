 /**
 * @PageObject TestRunner. Allows to easily rerun failed tests. 
 * Helps to analyze failures, flaky test cases  and generate reports and graphs.
 * @Version 0.0.2
 */
SeSPageObject("TestRunner");

eval(File.IncludeOnce('%WORKDIR%/PageObjects/TestRunner/TestRunnerSettings.js'));
eval(File.IncludeOnce('%WORKDIR%/PageObjects/TestRunner/TestRunnerUtil.js'));
eval(File.IncludeOnce('%WORKDIR%/PageObjects/TestRunner/SpiraUtil.js'));
eval(File.IncludeOnce('%WORKDIR%/PageObjects/TestRunner/PdfUtil.js'));

const DefaultBaseName = "TestRunInfo";

/**
 * Discovers failed test sets, corresponding test runs and executes root cause analysis for each failed test case.
 * @returns Path to generated summary PDF document.
 */
function TestRunner_DoAnalyzeFailures(/**string*/ rvlPath, /**string*/ summaryReportName)
{
	summaryReportName = summaryReportName || "Failure Analysis Summary Report";

	TestRunnerUtil.CheckCompatibility();

	const res = AiServerClient.SpiraSetCredentials();
	if (!res || !res.status)
	{
		return new SeSDoActionResult(false, null, res?.message);
	}
	
	if (File.Exists(rvlPath))
	{
		let summaryReportContent = "";
	
		TestRunnerUtil.DiscoverTestSets(rvlPath, true, function(testSetId, hostToken, projectId, failed) {
			if (failed)
			{
				Tester.Message(`Searching for failed test runs in test set: ${testSetId}`);
				const ts = SpiraUtil.GetTestSet(projectId, testSetId);
				const mappings = SpiraUtil.GetTestSetTestCaseMapping(projectId, testSetId);
				if (mappings)
				{
					for(let i = 0; i < mappings.length; i++)
					{
						const tcm = mappings[i];
						//Tester.Message(tcm.TestCaseId);
						const testRun = SpiraUtil.GetLatestRunForTestCase(projectId, tcm.TestCaseId);
						if (testRun && testRun.length)
						{
							const tr = testRun[0];
							if (tr.ExecutionStatusId == 1 /*failed*/)
							{
								Tester.Message(`Failed TC/TR: ${tcm.TestCaseId} / ${tr.TestRunId}`);
								const attachments = SpiraUtil.GetTestRunAttachments(projectId, tr.TestRunId);
								if (attachments && attachments.length)
								{
									const trpDocument = attachments.find(a => a.FilenameOrUrl == "last.trp");
									if (trpDocument)
									{
										const trpDocumentId = trpDocument.AttachmentId;
										Tester.Message(`Loading last.trp: ${trpDocumentId}`);
										const trpPath = Global.GetFullPath(TestRunnerSettings.GetDataPath(`${tr.TestRunId}.trp`));
										const downloadRes = AiServerClient.SpiraDownloadDocument(projectId, trpDocumentId, trpPath);
										if (downloadRes.status)
										{
											const tc = SpiraUtil.GetTestCase(projectId, tcm.TestCaseId);
											const title = `${tc.ProjectName}\\${ts.Name}\\${tc.Name}`;
											const analysis = AiTester.DoAnalyzeReport(title, trpPath);
											if (analysis)
											{
												summaryReportContent += `## ${title}\n\n${analysis}\n\n\n\n`;
											
												const mdFileName  =  Global.GetFullPath(TestRunnerSettings.GetDataPath(`${tr.TestRunId}_analysis.md`));
												File.Write(mdFileName, `## ${title}\n\n${analysis}`);
												
												const pdfFileName =  Global.GetFullPath(TestRunnerSettings.GetDataPath(`${tc.ProjectName}_${ts.Name}_${tc.Name}_${tr.TestRunId}_analysis.pdf`));
												PdfUtil.ConvertMDtoPDF(mdFileName, pdfFileName);
											}
										}
										else
										{
											Tester.Message(downloadRes.message);
										}
									}
								}
							}
						}
					}
				}
			}
		});
		
		if (summaryReportContent)
		{
			const mdFileName  =  Global.GetFullPath(TestRunnerSettings.GetDataPath(`${summaryReportName}.md`));
			File.Write(mdFileName, `# ${summaryReportName}\n\n`);
			File.Append(mdFileName, summaryReportContent);
			
			const pdfFileName =  Global.GetFullPath(TestRunnerSettings.GetDataPath(`${summaryReportName}.pdf`));
			PdfUtil.ConvertMDtoPDF(mdFileName, pdfFileName);
			return pdfFileName;
		}

		return new SeSDoActionResult(true, null);
	}

	Log(`Error: RVL file not found: ${rvlPath}`);
	return new SeSDoActionResult(false, null, `RVL file not found: ${rvlPath}`);
}

var _paramInfoTestRunner_DoAnalyzeFailures = {
	rvlPath: {
		description: "Path to RVL script that triggers Spira.RunTestSet actions.",
		binding: "path",
		ext: "rvl.xlsx"
	},
	summaryReportName: {
		description: "Name for the summary report file (without extension).",
		defaultValue: "Failure Analysis Summary Report"
	}
}

/**
 * Reruns test sets that were not executed or failed. Returns the number of scheduled test sets.
 */
function TestRunner_DoRerunFailedAndNotRun(/**string*/ rvlPath)
{
	TestRunnerUtil.CheckCompatibility();

	if (File.Exists(rvlPath))
	{
		let scheduledTestSetCount = 0;
	
		TestRunnerUtil.DiscoverTestSets(rvlPath, true, function(testSetId, hostToken, projectId, failed) {
			Spira.RunTestSet(testSetId, hostToken, projectId);
			Global.DoSleep(1000);
			scheduledTestSetCount++;
		});
		
		return scheduledTestSetCount;
	}
	
	Log(`Error: RVL file not found: ${rvlPath}`);
	return new SeSDoActionResult(false, -1, `RVL file not found: ${rvlPath}`);	
}

var _paramInfoTestRunner_DoRerunFailedAndNotRun = {
	rvlPath: {
		description: "Path to RVL script that triggers Spira.RunTestSet actions.",
		binding: "path",
		ext: "rvl.xlsx"
	}
}

/**
 * Sends the query to AI along with the test execution data.
 */
function TestRunner_DoAiReport(/**string*/ query, /**string*/ baseName)
{
	TestRunnerUtil.CheckCompatibility();
	
	if (!baseName)
	{
		baseName =  Global.GetProperty("BaseName", DefaultBaseName, TestRunnerSettings.ConfigFileName);
	}

	TestRunnerUtil.Init();
	
	const prompt = TestRunnerUtil.BuildPrompt(query, baseName);

	const res = AiTester.DoTextQuery(prompt, "AI Chat");
	const mdFileName  = TestRunnerSettings.GetDataPath(`${baseName}Analysis.md`);
	File.Write(mdFileName, res);
	
	const pdfFileName = TestRunnerSettings.GetDataPath(`${baseName}Analysis.pdf`);
	PdfUtil.ConvertMDtoPDF(mdFileName, pdfFileName);
	Global.DoCmd(pdfFileName, null, false);
	return pdfFileName;
}

var _paramInfoTestRunner_DoAiReport = {
	query: {
		description: "User query."
	},
	baseName: {
		description: "Base name for the input data file.",
		optional: true,
		defaultValue: DefaultBaseName
	}
}

/**
 * Sends the query to AI to generate a file with Python code, then runs the code. Python file name is <baseName>.py.
 */
function TestRunner_DoAiReportPy(/**string*/ query, /**string*/ baseName, /**string*/ promptFileName)
{
	TestRunnerUtil.CheckCompatibility();

	if (!baseName)
	{
		baseName =  Global.GetProperty("BaseName", DefaultBaseName, TestRunnerSettings.ConfigFileName);
	}

	const pyProgramFile = `${baseName}.py`;

	const prompt = TestRunnerUtil.BuildPromptPy(query, baseName, promptFileName);

	const res = AiTester.DoTextQuery(prompt, "AI Chat");
	const code = res.replace("```python", "").replace("```", "");
	File.Write(TestRunnerSettings.GetDataPath(pyProgramFile), code);
	
	const workDir = Global.GetFullPath(TestRunnerSettings.GetDataPath(""));
	Global.DoCmd(`${pyProgramFile}`, workDir, false);
	return true;
}

var _paramInfoTestRunner_DoAiReportPy = {
	query: {
		description: "User query."
	},
	baseName: {
		description: "Base name for the input data file.",
		optional: true,
		defaultValue: DefaultBaseName
	},
	promptFileName: {
		description: "Name of a .txt file with the base prompt to use. User query is appended to the end of the prompt.",
		optional: true,
		defaultValue: ""
	}
}

/**
 * Sends the query to AI to generate HTML report. Report file name is <baseName>Report.html.
 */
function TestRunner_DoAiReportHtml(/**string*/ query, /**string*/ baseName, /**string*/ promptFileName)
{
	TestRunnerUtil.CheckCompatibility();

	if (!baseName)
	{
		baseName =  Global.GetProperty("BaseName", DefaultBaseName, TestRunnerSettings.ConfigFileName);
	}

	const htmlReportFileName = `${baseName}Report.html`;
	const htmlReportFile = TestRunnerSettings.GetDataPath(htmlReportFileName);

	const prompt = TestRunnerUtil.BuildPromptHtml(query, baseName, promptFileName);

	const res = AiTester.DoTextQuery(prompt, "AI Chat");
	
	// write output
	const inputDataFileName = `Selected${baseName}.js`;
	const data = File.Read(TestRunnerSettings.GetDataPath(inputDataFileName));
	const code = res.replace("```html", "").replace("```", "");
	
	const injectionPoint1 = '<script src="d3.js"></script>';
	const injectionPoint2 = `<script src="${inputDataFileName}"></script>`;

	const injectionIndex1 = code.indexOf(injectionPoint1);
	const injectionIndex2 = code.indexOf(injectionPoint2);

	if (injectionIndex1 > 0 && injectionIndex2 > injectionIndex1)
	{
		const d3 = File.Read(TestRunnerSettings.GetDataPath("d3.js"));
		
		const part1 = code.substring(0, injectionIndex1);
		const part2 = code.substring(injectionIndex1 + injectionPoint1.length, injectionIndex2);
		const part3 = code.substring(injectionIndex2 + injectionPoint2.length);
		
		File.Write(htmlReportFile, part1);
		File.Append(htmlReportFile, "<script>");
		File.Append(htmlReportFile, d3);
		File.Append(htmlReportFile, "</script>");
		File.Append(htmlReportFile, part2);
		File.Append(htmlReportFile, "<script>");
		File.Append(htmlReportFile, data);
		File.Append(htmlReportFile, "</script>");
		File.Append(htmlReportFile, part3);
	}
	else if (injectionIndex2 > 0)
	{
		const part1 = code.substring(0, injectionIndex2);
		const part2 = code.substring(injectionIndex2 + injectionPoint2.length);
		
		File.Write(htmlReportFile, part1);
		File.Append(htmlReportFile, "<script>");
		File.Append(htmlReportFile, data);
		File.Append(htmlReportFile, "</script>");
		File.Append(htmlReportFile, part2);
	}
	else
	{
		File.Write(htmlReportFile, code);
	}
	
	const workDir = Global.GetFullPath(TestRunnerSettings.GetDataPath(""));
	Global.DoCmd(`${htmlReportFileName}`, workDir, false);
	return htmlReportFile;
}

var _paramInfoTestRunner_DoAiReportHtml = {
	query: {
		description: "User query."
	},
	baseName: {
		description: "Base name for the input data file.",
		optional: true,
		defaultValue: DefaultBaseName
	},
	promptFileName: {
		description: "Name of a .txt file with the base prompt to use. User query is appended to the end of the prompt.",
		optional: true,
		defaultValue: ""
	}
}

/**
 * Converts Markdown to PDF and opens the result.
 */
function TestRunner_DoMarkdownToPdf(/**string*/ mdFileName, /**string*/ pdfFileName, /**boolean*/ open)
{
	TestRunnerUtil.CheckCompatibility();
	TestRunnerUtil.Init();

	PdfUtil.ConvertMDtoPDF(mdFileName, pdfFileName);
	
	if (open)
	{
		Global.DoCmd(pdfFileName, null, false);
	}
	return true;
}

var _paramInfoTestRunner_DoMarkdownToPdf = {
	mdFileName: {
		description: "Input file in Markdown format."
	},
	pdfFileName: {
		description: "Output file in PDF format."
	},
	open: {
		description: "Set to `true` to open the result once generated.",
		optional: true,
		defaultValue: false
	}
}

/**
 * Converts TRP to PDF.
 */
function TestRunner_DoTrpToPdf(/**string*/ trpFileName, /**string*/ pdfFileName)
{
	// This one is fast and memory efficient, does not support templates

	const startTime = Date.now();
	
	TestRunnerUtil.CheckCompatibility();
	TestRunnerUtil.Init();
	
	trpFileName = Global.GetFullPath(trpFileName);
	pdfFileName = Global.GetFullPath(pdfFileName);
	const jsonlFileName = `${trpFileName}.jsonl`;
	TestRunnerUtil.ConvertTrpToJsonl(trpFileName, jsonlFileName);
	//AiServerClient.GeneratePDF(jsonlFileName, pdfFileName);
	PdfUtil.ConvertJsonltoPdf(jsonlFileName, pdfFileName);
	
	const endTime = Date.now();
	const duration = endTime - startTime;
	Tester.Message(`PDF generated in: ${TestRunnerUtil.FormatTime(duration)}`);	
	
	return true;
}

var _paramInfoTestRunner_DoTrpToPdf = {
	trpFileName: {
		description: "Input file in TRP format."
	},
	pdfFileName: {
		description: "Output file in PDF format."
	}
}

function TestRunner_DoReportToPdf(/**string*/ trpFileName, /**string*/ pdfFileName, /**string*/ browserType, /**string*/ browserPath)
{
	// This one uses Chrome or Edge and supports templates
	browserType = browserType || "chrome";

	function getChromeCmdLine()
	{
		let chromePath = browserPath;
		if (!chromePath)
		{
			chromePath = Global.GetSpecialFolderPath("ProgramFiles") + "\\Google\\Chrome\\Application\\chrome.exe";
			if (!File.Exists(chromePath))
			{
				chromePath = chromePath.replace(" (x86)", "");
			}
		}
		
		if (!File.Exists(chromePath))
		{
			return new SeSDoActionResult(false, null, `Chrome not found at "${chromePath}"`);
		}
		
		const userDataDir = Global.GetSpecialFolderPath("CommonApplicationData") + "\\Inflectra\\Rapise\\Temp\\Chrome";
		const fileUrl = `file:///${encodeURI(htmlFileName.replace(/\\/g, "/"))}`;
	
		const cmdLine = `"${chromePath}" --headless --no-pdf-header-footer --print-to-pdf="${pdfFileName}" --user-data-dir="${userDataDir}" ${fileUrl}`;
		return cmdLine;
	}

	function getEdgeCmdLine()
	{
		let edgePath = browserPath;
		if (!edgePath)
		{
			edgePath = Global.GetSpecialFolderPath("ProgramFiles") + "\\Microsoft\\Edge\\Application\\msedge.exe";
		}
		
		if (!File.Exists(edgePath))
		{
			return new SeSDoActionResult(false, null, `Edge not found at "${edgePath}"`);
		}
		
		const userDataDir = Global.GetSpecialFolderPath("CommonApplicationData") + "\\Inflectra\\Rapise\\Temp\\Edge";
		const fileUrl = `file:///${encodeURI(htmlFileName.replace(/\\/g, "/"))}`;
	
		const cmdLine = `"${edgePath}" --headless --no-pdf-header-footer --print-to-pdf="${pdfFileName}" --user-data-dir="${userDataDir}" ${fileUrl}`;
		return cmdLine;
	}

	const startTime = Date.now();

	trpFileName = Global.GetFullPath(trpFileName);
	pdfFileName = Global.GetFullPath(pdfFileName);
	const htmlFileName = Global.GetFullPath(`${trpFileName}.html`);
	
	const ldr = new ActiveXObject("Rapise.LogLoader");
	ldr.LoadTrp(trpFileName);
	ldr.ExportAsHtml("FullReportTpl.tt", htmlFileName);

	let cmdLine;
	if (browserType == "chrome")
	{
		cmdLine = getChromeCmdLine();
	}
	else
	{
	 	cmdLine = getEdgeCmdLine();
	}

	if (typeof(cmdLine) != "string")
	{
		return cmdLine;
	}
	
	Global.DoLaunch(cmdLine, null, null, null, true);

	const endTime = Date.now();
	const duration = endTime - startTime;
	Tester.Message(`PDF generated in: ${TestRunnerUtil.FormatTime(duration)}`);

	return true;
}

var _paramInfoTestRunner_DoReportToPdf = {
	trpFileName: {
		description: "Input file in TRP format."
	},
	pdfFileName: {
		description: "Output file in PDF format."
	},
	browserType: {
		descritpion: "`chrome` or `edge`.",
		optional: true,
		defaultValue: "chrome",
		binding:"enum",
		enumOpts: [
			["chrome"],
			["edge"]
		]
	},
	browserPath: {
		description: "Path to Chrome.exe or msedge.exe",
		optional: true
	}
}

/**
 * Queries test run history from Spira and saves data for further use by DoAiReport* actions.
 */
function TestRunner_DoAnalyzeRunHistory(/**number*/ projectId, /**boolean*/ automated, /**number*/ days, /**number*/ batchSize, /**boolean*/ failuresOnly, /**string*/ baseName)
{
	TestRunnerUtil.CheckCompatibility();

	if (!baseName)
	{
		baseName =  Global.GetProperty("BaseName", DefaultBaseName, TestRunnerSettings.ConfigFileName);
	}
	this.SetParameter("BaseName", baseName);

	if (typeof(automated) == "undefined")
	{
		automated = true;
	}
	
	TestRunnerUtil.Init();

	TestRunnerSettings.LoadParameters();
	TestRunnerSettings.TestRunTypeId = automated ? TestRunnerAutomatedTestRunType : TestRunnerManualTestRunType;
	failuresOnly = failuresOnly || false;
	
	const jsonlFileName = TestRunnerSettings.GetDataPath(`${baseName}.jsonl`);

	const count = SpiraUtil.GetTestRunCount(projectId, days);
	TestRunnerUtil.QueryRunHistory(projectId, count, batchSize, jsonlFileName);

	const testRunInfo = TestRunnerUtil.BuildTestRunInfo(projectId, jsonlFileName, failuresOnly);
	File.Write(TestRunnerSettings.GetDataPath(`Selected${baseName}.json`), JSON.stringify(testRunInfo, null, "  "));
	const lineCount = TestRunnerUtil.DistillSelectedTestRunInfoPlain(baseName);
	
	return new SeSDoActionResult(true, lineCount);
}

var _paramInfoTestRunner_DoAnalyzeRunHistory = {
	projectId: {
		description: "Id of project in Spira to query.",
		defaultValue: 1
	},
	automated: {
		description: "If `true`, query automated test runs; otherwise, query manual.",
		defaultValue: true
	},
	days: {
		description: "Query all test runs not older than the specified number of days.",
		defaultValue: 7
	},
	batchSize: {
		description: "Number of test runs to query in each batch request. Change to achieve better performance.",
		defaultValue: 5000
	},
	failuresOnly: {
		description: "Process only those test runs that did not pass.",
		defaultValue: true
	},
	baseName: {
		description: "Base name for intermediate data files.",
		defaultValue: DefaultBaseName,
		optional: true
	}
}

/**
 * Discovers flaky tests and saves their test run data for further use by  DoAiReport* actions.
 */
function TestRunner_DoAnalyzeFlakyTestCases(/**number*/ projectId, /**boolean*/ automated, /**number*/ runCount, /**number*/ batchSize, /**number*/ tcCount, /**string*/ baseName)
{
	TestRunnerUtil.CheckCompatibility();

	if (!baseName)
	{
		baseName =  Global.GetProperty("BaseName", DefaultBaseName, TestRunnerSettings.ConfigFileName);
	}
	this.SetParameter("BaseName", baseName);

	if (typeof(automated) == "undefined")
	{
		automated = true;
	}
	
	TestRunnerUtil.Init();

	TestRunnerSettings.LoadParameters();
	TestRunnerSettings.TestRunTypeId = automated ? TestRunnerAutomatedTestRunType : TestRunnerManualTestRunType;

	const totalCount = SpiraUtil.GetTestRunCount(projectId);
	const jsonlFileName = TestRunnerSettings.GetDataPath(`${baseName}.jsonl`);
	TestRunnerUtil.QueryRunHistory(projectId, Math.min(runCount, totalCount), batchSize, jsonlFileName);

	const testCaseArray = TestRunnerUtil.DiscoverFlakyTestCases(jsonlFileName)
	const testRunInfo = TestRunnerUtil.BuildTestCaseRunInfo(projectId, testCaseArray, tcCount);
	File.Write(TestRunnerSettings.GetDataPath(`Selected${baseName}.json`), JSON.stringify(testRunInfo, null, "  "));
	TestRunnerUtil.DistillSelectedTestRunInfo(baseName);
	
	return true;
}

var _paramInfoTestRunner_DoAnalyzeFlakyTestCases = {
	projectId: {
		description: "Id of project in Spira to query."
	},
	automated: {
		description: "If `true` - query automated test runs, otherwise query manual.",
		defaultValue: true
	},
	runCount: {
		description: "Number of recent test runs to query."
	},
	batchSize: {
		description: "Number of test runs to query in each batch request. Change to achieve better performance."
	},
	tcCount: {
		description: "Number of top flaky test cases to analyze."
	},
	baseName: {
		description: "Base name for intermediate data files.",
		defaultValue: DefaultBaseName,
		optional: true
	}
}

/**
 * Creates a document in Spira. Use it to attach generated reports.
 */
function TestRunner_DoSaveFileToSpira(/**number*/ projectId, /**number*/ documentFolderId, /**string*/ path)
{
	TestRunnerUtil.CheckCompatibility();

	if (!path)
	{
		Log("Warning: empty path in DoSaveFileToSpira");
		return true;
	}

	path = Global.GetFullPath(path);

	const project = Spira.GetProjectById(projectId);
	if (!project)
	{
		return false;
	}
	
	const documentTypes = SpiraUtil.GetDocumentTypes(project.ProjectTemplateId);
	if (!documentTypes)
	{
		return false;
	}
	
	let defaultDocumentTypeId = 0;
	for (let i = 0; i < documentTypes.length; i++) 
	{
		const documentType = documentTypes[i];
		if (documentType.Default === true) 
		{
			defaultDocumentTypeId = documentType.DocumentTypeId;
			break;
		}
	}
	
	if (!defaultDocumentTypeId)
	{
		return false;
	}
	
	const documentId = SpiraUtil.UploadDocument(projectId, documentFolderId, defaultDocumentTypeId, path);
	return documentId;
}

var _paramInfoTestRunner_DoSaveFileToSpira = {
	projectId: {
		description: "Id of the project in Spira."
	},
	documentFolderId: {
		description: "Id of the document folder in Spira."
	},
	path: {
		description: "Path to the file to save."
	}
};

function TestRunner_SetParameter(/**string*/ name, /**object*/ value)
{
	TestRunnerUtil.CheckCompatibility();

	Global.SetProperty(name, value, TestRunnerSettings.ConfigFileName);
}

var _paramInfoTestRunner_SetParameter = {
	name: {
		description: "Parameter name."
	},
	value: {
		description: "Parameter value."
	}
}

/**
 * Discovers all test sets triggered by Spira.RunTestSet from a given RVL script and builds execution summary report for current date.
 */
function TestRunner_DoDailySummaryReport(/**string*/ rvlPath, /**string*/ summaryReportName)
{
	TestRunnerUtil.CheckCompatibility();

	summaryReportName = summaryReportName || "DailySummaryReport";
	
	const date =  UtilGetPaddedZeroesDate(new Date());
	
	summaryReportName += `_${date}`;


	const model = {
		testSets: []
	};
	
	const projectTestSetsMap = {};
	
	TestRunnerUtil.DiscoverTestSets(rvlPath, false, function(testSetId, hostToken, projectId, failed) {
		if (projectTestSetsMap[projectId])
		{
			projectTestSetsMap[projectId].push(testSetId);
		}
		else
		{
			projectTestSetsMap[projectId] = [testSetId];
		}
	});
	
	for (const projectId in projectTestSetsMap) 
	{
		if (projectTestSetsMap.hasOwnProperty(projectId)) 
		{
			SpiraUtil.GenerateReportForProject(projectId, projectTestSetsMap[projectId], model);
		}
	}

	return SpiraUtil.OutputSummaryReportHtml(model, summaryReportName);
}

var _paramInfoTestRunner_DoDailySummaryReport = {
	rvlPath: {
		description: "Path to RVL script that triggers Spira.RunTestSet actions.",
		binding: "path",
		ext: "rvl.xlsx" 
	},
	summaryReportName: {
		description: "Name for the summary report file (without extension).",
		optional: true,
		defaultValue: "DailySummaryReport"
	}
}
