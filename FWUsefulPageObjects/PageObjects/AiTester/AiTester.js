/**
 * @PageObject AiTester. Enables AI capabilities during test case execution. Use AiTester to generate data,
 * perform image-based assertions (such as finding discrepancies and analyzing displayed content), and handle
 * other tasks that require AI processing.
 * @Version 0.0.3
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

function AiTesterGetWorkflow(/**string*/ workflow)
{
	if (!workflow)
	{
		return null;
	}
	
	function _getWorkflowFrom(path)
	{
		if (File.FolderExists(path))
		{
			var files = File.Find(path, "*.json");
			files = files ? files.split('\n') : [];
			for (var i = 0; i < files.length; i++)
			{
				var f = files[i];
				try
				{
					var _wf = JSON.parse(File.Read(f));
					if (_wf.id == workflow || _wf.name.toLowerCase() == workflow.toLowerCase())
					{
						return _wf;
					}
				}
				catch(ex)
				{
					if (l2) Log2("Failed to parse: " + f);
				}
			}
		}
		return null;
	}

	var wf = null;
	var localPath = Global.GetFullPath("AI\\workflows");
	wf = _getWorkflowFrom(localPath);

	if (!wf)
	{
		var globalPath = g_helper.ResolveEnvironmentVariables("%ALLUSERSPROFILE%\\Inflectra\\Rapise\\AI\\workflows");
		wf = _getWorkflowFrom(globalPath);
	}
	
	return wf;
}

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

function AiTesterMakeAssertionQuery(response, assertion)
{
 	var aQuery = aiTesterAssertionSystemPrompt;
	aQuery = aQuery.replace("${assertion}", assertion);
	aQuery = aQuery.replace("${response}", response);
	var result = AiTester_DoTextQuery(aQuery);
	return result;
}

/**
 * Tests assertion against the text.
 */
 function AiTester_Assert(/**string*/ text, /**string*/ assertion)
 {
	var result = AiTesterMakeAssertionQuery(text, assertion);
	var data = [];
	if( result!="1" )
	{
		data.push(result);
	}
	Tester.Assert(assertion, result == "1", data);
 }

 var _paramInfoAiTester_Assert = {
 	assertion: aiTesterParamInfo.assertion
 }
 
/**
 * Tests assertion against the last response.
 */
 function AiTester_AssertLastResponse(/**string*/ assertion)
 {
	var data = [aiTesterLastResponse];
	var result = AiTesterMakeAssertionQuery(aiTesterLastResponse, assertion);
	if( result!="1" )
	{
		data.push(result);
	}
	
	Tester.Assert(assertion, result == "1", data);
 }
 
 var _paramInfoAiTester_AssertLastResponse = {
 	assertion: aiTesterParamInfo.assertion
 }

/**
 * Tests soft assertion against the response.
 */
 function AiTester_SoftAssert(/**string*/ text, /**string*/ assertion)
 {
	var result = AiTesterMakeAssertionQuery(text, assertion);
	var data = [];
	if( result!="1" )
	{
		data.push(result);
	}
	Tester.SoftAssert(assertion, result == "1", data);
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
	var result = AiTesterMakeAssertionQuery(aiTesterLastResponse, assertion);
	if( result!="1" )
	{
		data.push(result);
	}
	Tester.SoftAssert(assertion, result == "1", data);
 }
 
 var _paramInfoAiTester_SoftAssertLastResponse = {
 	assertion: aiTesterParamInfo.assertion
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

	// search for the workflowId
	var wf = AiTesterGetWorkflow(workflow);
	if (!wf)
	{
		return new SeSDoActionResult(false, null, "Workflow " + workflow + " is not found");
	}
	
	var payload = {
		question: query,
		workflowId: wf.id,
		logSessions: aiTesterLogSessions
	}
	
	if (images)
	{
		payload.images = images;
	}

	AiServerClient.SetCurrentContext();
	var response = AiServerClient.QueryWorkflow(payload);
	Log("AI Query: " + query);
	Log("AI Answer:" + response);
	
	aiTesterLastResponse = response;
	
	if (!images || images.length == 0)
	{
		return response;
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
