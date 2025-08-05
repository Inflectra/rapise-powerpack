/**
 * @PageObject AiTester. Enables AI capabilities during test case execution. Use AiTester to generate data,
 * perform image-based assertions (such as finding discrepancies and analyzing displayed content), and handle
 * other tasks that require AI processing.
 * @Version 0.0.10
 */
SeSPageObject("AiTester");

var aiTesterDefaultWorkflow = "faf4fdc9-08b0-4ef5-8194-1b60849caacc"; // AI Chat No Explanations
var aiTesterLogSessions = false;

var aiTesterLastResponse;
var aiTesterLastQuery;
var aiTesterImages = [];

var aiTesterParamInfo = {
	query: {
		description: "Text query to send."
	},
	iw: {
		description: "Image to send."
	},
	workflow: {
		description: "Name or Id of the workflow to use. Default value is `AI Chat`. You may set the workflow with AiTester.SetDefaultWorkflow.",
		optional: true
	},
	text: {
		description: "Input text."
	},	
	assertion: {
		description: "Assertion to test against the response."
	},
	response: {
 		description: "Response string from an AI query."
 	},
 	objectId: {
 		description: "ID of an object in the object repository."
 	},
 	title: {
 		description: "Window title. Supports regular expressions."
 	}
};

var aiTesterAssertionSystemPrompt = "Test the provided ASSERTION against the RESPONSE. If assertion is valid return 1, if not return explanation.\nASSERTION: ${assertion}\nRESPONSE: ${response}";

/**
 * Sets default workflow.
 */
function AiTester_SetDefaultWorkflow(/**string*/ workflow)
{
	aiTesterDefaultWorkflow = workflow;
}

var _paramInfoAiTester_SetDefaultWorkflow = {
	workflow: {
		description: "Name or Id of the workflow to set as default."
	}
}

/**
 * Enables/disables session logging.
 */
 function AiTester_LogSessions(/**boolean*/ b)
 {
 	aiTesterLogSessions = b;
 }
 
 var _paramInfoAiTester_LogSessions = {
 	b: {
 		description: "If `true` - a session will be created for each AI request. Review the sessions in the AI Dashboard."
 	}
 }

/**
 * Adds browser screenshot to the batch to send along with the AiTester.DoMultiImageQuery.
 */
function AiTester_StackWebImage()
{
	var iw = WebDriver.GetScreenshotIW();
	aiTesterImages.push(iw);
}

var _paramInfoAiTester_StackWebImage = {
}

/**
 * Adds a screenshot to the batch to send along with the AiTester.DoMultiImageQuery.
 */
function AiTester_StackImage(/**ImageWrapper*/ iw)
{
	aiTesterImages.push(iw);
}

var _paramInfoAiTester_StackImage = {
	iw: {
		description: "Image object."
	}
}

/**
 * Adds a screenshot file to the batch to send along with the AiTester.DoMultiImageQuery.
 */
function AiTester_StackImageFile(/**string*/ path)
{
	var fullPath = Global.GetFullPath(path);
	if (File.Exists(fullPath))
	{
		var iw = new ActiveXObject("SeSWrappers.Utils.ImageWrapper");
		iw.Load(fullPath);
		aiTesterImages.push(iw);
	}
}

var _paramInfoAiTester_StackImageFile = {
	path: {
		description: "Image object.",
		binding: "path",
		ext: "gif;png;tiff;bmp;jpg;jpeg"
	}
}

/**
 * Sends a text query to AI model using specified or default workflow.
 */
function AiTester_DoTextQuery(/**string*/ query, /**string*/ workflow)
{
	return AiTesterDoImageQueryImpl(query, null, workflow);
}

var _paramInfoAiTester_DoTextQuery = {
	query: aiTesterParamInfo.query,
	workflow: aiTesterParamInfo.workflow
}

/**
 * Sends a text query along with a browser screenshot to AI model using specified or default workflow. Verifies the result.
 */
function AiTester_DoWebImageVerify(/**string*/ query, /**string*/ assertion, /**string*/ workflow)
{
	var iw = WebDriver.GetScreenshotIW();
	var result = AiTester_DoImageQuery(query, iw, workflow);
	if (result.status)
	{
		var response = result.additional_value;
		return AiTesterAssertion(response, assertion);
	}
	return result;
}

var _paramInfoAiTester_DoWebImageVerify = {
	query: aiTesterParamInfo.query,
	assertion: aiTesterParamInfo.assertion,
	workflow: aiTesterParamInfo.workflow
}

/**
 * Sends a text query along with a browser screenshot to AI model using specified or default workflow.
 */
function AiTester_DoWebImageQuery(/**string*/ query, /**string*/ workflow)
{
	var iw = WebDriver.GetScreenshotIW();
	return AiTester_DoImageQuery(query, iw, workflow);
}

var _paramInfoAiTester_DoWebImageQuery = {
	query: aiTesterParamInfo.query,
	workflow: aiTesterParamInfo.workflow
}

/**
 * Sends a text query along with the set of images added via AiTester.StackWebImage. Clears the stack after the query.
 */
function AiTester_DoMultiImageQuery(/**string*/ query, /**string*/ workflow)
{
	var images = aiTesterImages.slice();
	aiTesterImages = [];
	return AiTesterDoImageQueryImpl(query, images, workflow);
}

var _paramInfoAiTester_DoMultiImageQuery = {
	query: aiTesterParamInfo.query,
	workflow: aiTesterParamInfo.workflow
}

/**
 * Sends a text query along with an image to AI model using specified or default workflow.
 */
function AiTester_DoImageQuery(/**string*/ query, /**ImageWrapper*/ iw, /**string*/ workflow)
{
	return AiTesterDoImageQueryImpl(query, [iw], workflow);
}

var _paramInfoAiTester_DoImageQuery = {
	query: aiTesterParamInfo.query,
	iw: aiTesterParamInfo.iw,
	workflow: aiTesterParamInfo.workflow
}

/**
 * Sends a text query along with a screenshot of an object to AI model using specified or default workflow.
 */
function AiTester_DoObjectQuery(/**objectId*/ objectId, /**string*/ query, /**string*/ workflow)
{
	if (!objectId)
	{
		return new SeSDoActionResult(false, null, "objectId is not set");
	}
	
	var obj = Global._DoWaitFor(objectId);
	
	if (!obj)
	{
		return new SeSDoActionResult(false, null, objectId + " is not found");
	}

	var iw = obj.GetBitmap();
	return AiTesterDoImageQueryImpl(query, [iw], workflow);
}

var _paramInfoAiTester_DoObjectQuery = {
	query: aiTesterParamInfo.query,
	objectId: aiTesterParamInfo.objectId,
	workflow: aiTesterParamInfo.workflow
}

/**
 * Sends a text query along with a screenshot of a window with the given title to AI model using specified or default workflow.
 */
function AiTester_DoWindowQuery(/**string*/ title, /**string*/ query, /**string*/ workflow)
{
	if (!title)
	{
		return new SeSDoActionResult(false, null, "title is not set");
	}
	
	var res = Global._DoWaitForWindow(title);
	
	if (!res)
	{
		return new SeSDoActionResult(false, null, "Window with title \"" + title + "\" is not found");
	}

	var wnd =  g_util.FindWindow(title, "regex:.*");
	var iw = SeSCaptureImageDefaultImpl(wnd.PosX, wnd.PosY, wnd.PosWidth, wnd.PosHeight, false);
	return AiTesterDoImageQueryImpl(query, [iw], workflow);
}

var _paramInfoAiTester_DoWindowQuery = {
	query: aiTesterParamInfo.query,
	title: aiTesterParamInfo.title,
	workflow: aiTesterParamInfo.workflow
}

/**
 * Sends a text query along with a screenshot of a desktop to AI model using specified or default workflow.
 */
function AiTester_DoFullScreenQuery(/**string*/ query, /**string*/ workflow)
{
	var iw = SeSCaptureImageDefaultImpl(0, 0, 0, 0, false);
	return AiTesterDoImageQueryImpl(query, [iw], workflow);
}

var _paramInfoAiTester_DoFullScreenQuery = {
	query: aiTesterParamInfo.query,
	workflow: aiTesterParamInfo.workflow
}

function AiTesterMakeAssertionQuery(response, assertion, soft)
{
 	var aQuery = aiTesterAssertionSystemPrompt;
	aQuery = aQuery.replace("${assertion}", assertion);
	aQuery = aQuery.replace("${response}", response);
	var result = AiTester_DoTextQuery(aQuery);
	
	var data = [result.additional_value+" (1 - Pass)", "RESPONSE: "+response];

	if( soft ) {
		Tester.SoftAssert(assertion, result.additional_value == "1", data);
	} else {
		Tester.Assert(assertion, result.additional_value == "1", data);
	}
	return result;
}

/**
 * Tests assertion against the text.
 */
 function AiTester_Assert(/**string*/ text, /**string*/ assertion)
 {
	AiTesterMakeAssertionQuery(text, assertion, false);
 }

 var _paramInfoAiTester_Assert = {
 	assertion: aiTesterParamInfo.assertion
 }
 
/**
 * Tests assertion against the last response.
 */
 function AiTester_AssertLastResponse(/**string*/ assertion)
 {
	var result = AiTesterMakeAssertionQuery(aiTesterLastResponse, assertion, false);
 }
 
 var _paramInfoAiTester_AssertLastResponse = {
 	assertion: aiTesterParamInfo.assertion
 }

/**
 * Tests soft assertion against the response.
 */
 function AiTester_SoftAssert(/**string*/ text, /**string*/ assertion)
 {
	AiTesterMakeAssertionQuery(text, assertion, true);
 }
 
 var _paramInfoAiTester_SoftAssert = {
 	text: aiTesterParamInfo.text,
 	assertion: aiTesterParamInfo.assertion
 }
 
 /**
 * Tests soft assertion against the last response.
 */
 function AiTester_SoftAssertLastResponse(/**string*/ assertion)
 {
	var data = [aiTesterLastResponse];
	AiTesterMakeAssertionQuery(aiTesterLastResponse, assertion, true);
 }
 
 var _paramInfoAiTester_SoftAssertLastResponse = {
 	assertion: aiTesterParamInfo.assertion
 }

/**
 * Analyzes TRP report and provides root cause analysis.
 */
function AiTester_DoAnalyzeReport(/**string*/ title, /**string*/ path)
{
	if (!Global.GetRapiseVersion("8.4"))
	{
		Tester.Assert("To analyze reports with AI you need Rapise 8.4+", false);
	}
	
	const jsonPath = path + ".json";
	if (!AiTesterConvertTrpToJson(path, jsonPath))
	{
		return false;
	}
	
	const jsonData = JSON.parse(File.Read(jsonPath));
	let skipImages = false;
	const jsonFileInfo = File.Info(jsonPath);
	if (jsonFileInfo.Size > 1000000)
	{
		skipImages = true;
	}
	
	if (skipImages) 
	{
		const entries = jsonData.entries;
		let lastImageData = null;
		let lastImageEntryIndex = null;
		
		// Find the last image data entry across all entries and record its entry index
		for (let i=0; i<entries.length; i++) 
		{
			const entry = entries[i];
			if (entry.data)
			{
				for (const data of entry.data)
				{
					if (data.attributes.some(attr => attr.name === "type" && attr.value === "image")) 
					{
						lastImageData = data;
						lastImageEntryIndex = i;
					}
				}
			}
			else
			{
				entry.data = [];
			}
		}
	
		if (lastImageData)
		{
	
			// Filter each log entry, setting `data` to be just the last image data entry or empty array if none
			jsonData.entries = entries.map((entry, index) => {
				if (index === lastImageEntryIndex)
				{
					return {
						...entry,
						data: entry.data.filter(data=> data === lastImageData)
					}
				}
				else
				{
					return { ...entry, data: entry.data.filter(d => !d.attributes.some(attr => attr.name === "type" && attr.value === "image")) };
				}
			
			});
		}
	}
	
	const payload = AiTesterConvertTrpToOpenAIPayload(jsonData);
	if (payload)
	{
		File.Write(path + ".payload.json", JSON.stringify(payload, null, "  "));
	}
	else
	{
		return false;
	}
	const result = AiServerClient.Query(payload, { });
	if (result?.response?.content)
	{
		const content = result.response.content;
		Tester.Message("Report Analysis for " + title, new SeSReportText("<pre>" + result.response.content.replace(/\n/ig,"<br/>") + "</pre>"));
		return content;
	}
	else
	{
		Tester.Message("AI query returned no response, error: " + result?.message);
		return false;
	}
}

var _paramInfoAiTester_DoAnalyzeReport = {
	title: {
		description: "Report message title."
	},
	path: {
		descripton: "Path to TRP report.",
		binding: "path",
		ext: "trp"
	}
}

/**
 * Converts TRP report into JSON format.
 */
function AiTesterConvertTrpToJson(path, outputPath)
{
	var ldr = new ActiveXObject("Rapise.LogLoader");
	ldr.LoadTrp(path);
	if (!ldr.ExportAsJson(outputPath))
	{
		Log(ldr.ExportErrors);
		return false;
	}
	return true;
}

/**
 * Converts report in JSON format into OpenAI request for report analysis.
 */
function AiTesterConvertTrpToOpenAIPayload(model) 
{
	const messages = [
		{
		  role: "system",
		  content: "This is an execution report for an automated UI test. Analyze the report and the attached screenshots (they may display errors or look weird). What can be the root cause of the failure?"
		},
	];
	
	model.entries.forEach((entry, index) => {
		const attributesMarkdown = entry.attributes
			.map(attr => `**${attr.name}**: ${attr.value}`)
			.join("\n");
	
		let dataText = "";
	
		if (entry.data)
		{
			dataText = entry.data
				.filter(dataEntry => !dataEntry.attributes.some(attr => attr.name === "type" && attr.value === "image"))
				.map(dataEntry => dataEntry.value)
				.join("\n");
		
			const dataImages = entry.data
				.filter(dataEntry => dataEntry.attributes.some(attr => attr.name === "type" && attr.value === "image"));
		
			dataImages.forEach(dataEntry => {
				messages.push({
					role: "user",
					content: [{
						type: "image_url",
						image_url: { url: `data:image/png;base64,${dataEntry.value}` }
					}]
				});
			});
		}
	
		messages.push({
			role: "user",
			content: `### Log Entry ${index + 1}\n\n${attributesMarkdown}\n\n${dataText}`
		});
	});
	
	return {
		messages
	};
}

/**
 * Sends a text query along with an image to AI model using specified workflow.
 */
function AiTesterDoImageQueryImpl(/**string*/ query, /**ImageWrapper[]*/ images, /**string*/ workflow)
{
	workflow = workflow || aiTesterDefaultWorkflow;

	aiTesterLastResponse = undefined;
	aiTesterLastQuery = query;

	if (!query)
	{
		return new SeSDoActionResult(false, null, "Query is not set");
	}
	
	var reportImages = [];
	if (images && images.length)
	{
		for(var i = 0; i < images.length; i++)
		{
			var iw = images[i];
			reportImages.push(new SeSReportImage(iw));
			if (!iw)
			{
				return new SeSDoActionResult(false, null, "Image " + (i+1) + " is not set");
			}
			images[i] = iw.ToBase64Bitmap();
		}
	}

	var payload = {
		question: query,
		workflowId: workflow,
		logSessions: aiTesterLogSessions
	}
	
	if (images)
	{
		payload.images = images;
	}

	AiServerClient.SetCurrentContext();
	var response = AiServerClient.QueryWorkflow(payload);
	Log("AI Query: " + (query.length < 512 ? query : query.substring(0, 512) + "..."));
	Log("AI Answer:" + (response.length < 512 ? response : response.substring(0, 512) + "..."));
	
	aiTesterLastResponse = response;
	
	if (!images || images.length == 0)
	{
		return new SeSDoActionResult(true, response, undefined, ["<pre>" + response.replace(/\n/ig,"<br/>") + "</pre>"], {comment:response});
	}
	
	return new SeSDoActionResult(true, response, undefined, [response].concat(reportImages), {comment:response});
}

/**
 * Tests assertion against the response.
 */
function AiTesterAssertion(/**string*/ response, /**string*/ assertion)
{
	var aQuery = aiTesterAssertionSystemPrompt;
	aQuery = aQuery.replace("${assertion}", assertion);
	aQuery = aQuery.replace("${response}", response);
	var result = AiTester_DoTextQuery(aQuery);
	return new SeSDoActionResult(result == "1", response, undefined, [response, result], {comment:response});
}
