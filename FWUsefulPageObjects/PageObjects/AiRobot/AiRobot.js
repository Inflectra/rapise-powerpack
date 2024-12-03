/**
 * @PageObject AiRobot. Implements fully-automatic interactions with target window or screen region (keyboard and mouse). Should be used when AI is unable to
 * find reasonable entries in other page objects. This way of interacting is last resort. It may be applied to complex, exploratory style actions.
 * @Version 0.0.42
 */

SeSPageObject("AiRobot");

function _RobotSyncRun(f)
{
	const deasync = require("deasync");
	let asyncResult = undefined;
	let asyncDone = false;
	async function impl() {
		try
		{
			asyncResult = await f();
		} catch (e) {
			const data = [e.stack];
			const pos = _extractFirstEntryAfterCallLog(e.stack);
			if (pos) {
				data.push(
					new SeSReportLink(pos.filePath + "(" + pos.lineNumber + "," + pos.columnNumber + ")")
				);
			}
			Tester.SoftAssert(e.message, false, data);

			asyncResult = false;
		} finally {
			asyncDone = true;
		}
	}
	impl();
	while (!asyncDone) {
		deasync.runLoopOnce();
	}
	return asyncResult;
}

function _extractFirstEntryAfterCallLog(callStack)
{
	// Find the index of "Call log:" in the stack
	const callLogIndex = callStack.indexOf("Call log:");

	if (callLogIndex === -1) {
		return null; // No "Call log:" found
	}

	// Extract the portion of the stack trace after "Call log:"
	const stackAfterCallLog = callStack.slice(callLogIndex);

	// Regular expression to match the file path, line number, and column number
	const regex = /at (.+):(\d+):(\d+)/;

	// Find the first match in the portion after "Call log:"
	const match = stackAfterCallLog.match(regex);

	if (match) {
		const filePath = match[1];
		const lineNumber = match[2];
		const columnNumber = match[3];

		return {
			filePath,
			lineNumber,
			columnNumber
		};
	} else {
		return null; // No match found
	}
}

function _AiRobotInit()
{
	if(!Global.GetRapiseVersion("8.3"))
	{
		Tester.Assert("AiRobot requires Rapise version 8.3 or higher", false, "Actual version: "+Global.GetRapiseVersion());
	}
	// Restore packages if needed
	if (!File.FolderExists(g_workDir + '\\node_modules') || !File.FolderExists(g_workDir + '\\node_modules\\sharp'))
	{
		Global.DoCmd('PageObjects\\AiRobot\\install.cmd', g_workDir, true, true);
	}
}

var _AiRobotParamInfo = {
	prompt: {
		type: 'string',
		description: 'Clear explanation of what you want AiRobot to do with a given target.'
	},
	max_tokens: {
		type: 'number',
		description: 'Maximum amount of tokens per response.',
		optional: true,
		defaultValue: 1000
	},
	token_limit: {
		type: 'number',
		description: 'Token limit to be used for whole prompt.',
		optional: true,
		defaultValue: 1000000
	},
	n_last_images: {
		type: 'number',
		description: 'Number of images to remember.',
		optional: true,
		defaultValue: 5
	},
	timeout: {
		type: 'number',
		description: 'Maximum time to wait, in milliseconds',
		optional: true,
		defaultValue: 600000
	},
	_returns: '`true` if the upload was successful; otherwise, it returns `false`.'
};

/*
export interface ChatStatus {
  start: Date;            // The start time of the loop
  end?: Date;             // The end time of the loop
  duration?: number;      // Duration in milliseconds
  prompt: string;         // The initial prompt
  input_tokens: number;   // Total input tokens used
  output_tokens: number;  // Total output tokens received
  stop_reason: string;    // Reason for stopping the loop
  success: boolean;       // Indicates if the loop was successful
  tool_invocations: number; // Number of tool invocations
  prompt_queries: number; // Number of prompt queries made
}
*/

global.g_aiRobotStats = {input_tokens: 0, output_tokens: 0, prompt_queries: 0, tool_invocations: 0};

async function _AiRobotRun(prompt, targetWindow, /**number*/ timeout, /**number*/ n_last_images, /**number*/ max_tokens, /**number*/ token_limit)
{
	_AiRobotInit();
	var p = File.ResolvePath('%WORKDIR%/PageObjects/AiRobot/ComputerUseImpl.js')
	const ComputerUseImplClass = require(p).ComputerUseImpl;

	if(AiRobot.config)
	{
		if(typeof timeout==='undefined') timeout = AiRobot.config.timeout;
		if(typeof n_last_images==='undefined') n_last_images = AiRobot.config.n_last_images;
		if(typeof max_tokens==='undefined') max_tokens = AiRobot.config.max_tokens;
		if(typeof token_limit==='undefined') token_limit = AiRobot.config.token_limit;	
	}

	const status = await ComputerUseImplClass.toolUseLoop(prompt, targetWindow, max_tokens, n_last_images, timeout, token_limit, this.system_prompt);

	const statFileName = "AI/robot_stat.json";
	let input_tokens = Global.GetProperty("input_tokens", 0, statFileName);
	let output_tokens = Global.GetProperty("output_tokens", 0, statFileName);
	let prompt_queries = Global.GetProperty("prompt_queries", 0, statFileName);
	let tool_invocations = Global.GetProperty("tool_invocations", 0, statFileName);

	input_tokens += status.input_tokens;
	output_tokens += status.output_tokens;
	prompt_queries += status.prompt_queries;
	tool_invocations += status.tool_invocations;

	// Update global.g_aiRobotStats by adding the values from the current status
	global.g_aiRobotStats.input_tokens += status.input_tokens;
	global.g_aiRobotStats.output_tokens += status.output_tokens;
	global.g_aiRobotStats.prompt_queries += status.prompt_queries;
	global.g_aiRobotStats.tool_invocations += status.tool_invocations;

	Global.SetProperty("input_tokens", input_tokens, statFileName);
	Global.SetProperty("output_tokens", output_tokens, statFileName);
	Global.SetProperty("prompt_queries", prompt_queries, statFileName);
	Global.SetProperty("tool_invocations", tool_invocations, statFileName);
	Global.SetProperty("last_status", status, statFileName);

	let prompt_history = Global.GetProperty("prompt_history", [], statFileName);
	prompt_history.push({prompt, status});
	Global.SetProperty("prompt_history", prompt_history, statFileName);

	let data = [JSON.stringify(status, null, 2), "Totals for this test run", JSON.stringify(global.g_aiRobotStats, null, 2)];
	data.push(new SeSReportImage(targetWindow.lastImage));
	const val = targetWindow.GetReturnValue();
	
	if(typeof val != 'undefined') data.push(val);
	
	var result = new SeSDoActionResult(
			status && status.success,
			val,
			"AiRobot done: " + prompt,
			data,
			val?{comment:val}:undefined
		);

	return result;
}

/**
 * Set common execution parameters and limitations.
 **/
function AiRobot_DoConfigure(/**string*/system_prompt, /**number*/ timeout, /**number*/ n_last_images, /**number*/ max_tokens, /**number*/ token_limit)
{
	AiRobot.config = {system_prompt, timeout, n_last_images, max_tokens, token_limit};
	return true;
}

var _paramInfoAiRobot_DoConfigure = {
	system_prompt: {
		type: 'string',
		description: 'Additional prompt to be used for all interactions.'
	},
	token_limit: _AiRobotParamInfo.token_limit,
	max_tokens: _AiRobotParamInfo.max_tokens,
	n_last_images: _AiRobotParamInfo.n_last_images,
	timeout: _AiRobotParamInfo.timeout,
};

/**
 * Add a the following system prompt:
 *   After each step, take a screenshot and carefully evaluate if you have achieved the right outcome. Explicitly show your thinking: "I have evaluated step X..." If not correct, try again. Only when you confirm a step was executed correctly should you move on to the next one.
 * 
 *   As recommended here:
 *   https://docs.anthropic.com/en/docs/build-with-claude/computer-use#optimize-model-performance-with-prompting
 */
function AiRobot_SetSelfCheck()
{
	this.config = this.config || {};
	this.config.system_prompt = "After each step, take a screenshot and carefully evaluate if you have achieved the right outcome. Explicitly show your thinking: 'I have evaluated step X...' If not correct, try again. Only when you confirm a step was executed correctly should you move on to the next one.";
}

/**
 * Do fully automation AI interactions with currently active web browser window.
 * 
 * Example 1: 
 *  Navigator.Open("https://v3.libraryinformationsystem.org/");
 * 	AiRobot.DoWebBrowser("Login as borrower/borrower");
 * 
 * Example 2:
 *  // Navigator open earlier and browser is logged in
 * 	AiRobot.DoWebBrowser("Change the genre of the book 'The Sign of the Four' to 'Detective Fiction'.");
 * 
 * Note to keep your window small. Something bigger than 1024x768 may lead to incorrect clicks.
 */
function AiRobot_DoWebBrowser( /**string*/ prompt, /**number*/ timeout, /**number*/ n_last_images, /**number*/ max_tokens, /**number*/ token_limit)
{
	var success = false;
	_RobotSyncRun(async () => {
		eval(File.IncludeOnce('%WORKDIR%/PageObjects/AiRobot/TargetWindowScreenRegion.js'));
		Navigator.Open("");
		const navWindow = TargetWindowScreenRegion.FromWebDriver();
		success = await _AiRobotRun(prompt, navWindow, /**number*/ timeout, /**number*/ n_last_images, /**number*/ max_tokens, /**number*/ token_limit);
	});

	return success;
}

var _paramInfoAiRobot_DoWebBrowser = {
	prompt: _AiRobotParamInfo.prompt,
	token_limit: _AiRobotParamInfo.token_limit,
	max_tokens: _AiRobotParamInfo.max_tokens,
	n_last_images: _AiRobotParamInfo.n_last_images,
	timeout: _AiRobotParamInfo.timeout,
};

/**
 * Do fully automation AI interactions first screen.
 * Example 1: AiRobot.DoFullScreen("Press 'Excel' launch icon on the desktop.");
 * It is bad idea to use this function if screen size is higher than 1280x768.
 */
function AiRobot_DoFullScreen( /**string*/ prompt, /**number*/ timeout, /**number*/ n_last_images, /**number*/ max_tokens, /**number*/ token_limit)
{
	var success = false;
	_RobotSyncRun(async () => {
		eval(File.IncludeOnce('%WORKDIR%/PageObjects/AiRobot/TargetWindowScreenRegion.js'));
		const navWindow = TargetWindowScreenRegion.FromScreen();
		success = await _AiRobotRun(prompt, navWindow, /**number*/ timeout, /**number*/ n_last_images, /**number*/ max_tokens, /**number*/ token_limit);
	});

	return success;
}

var _paramInfoAiRobot_DoFullScreen = {
	prompt: _AiRobotParamInfo.prompt,
	token_limit: _AiRobotParamInfo.token_limit,
	max_tokens: _AiRobotParamInfo.max_tokens,
	n_last_images: _AiRobotParamInfo.n_last_images,
	timeout: _AiRobotParamInfo.timeout,
};

/**
 * Do fully automation AI interactions first screen.
 * Example 1: AiRobot.DoScreenRegion("Press 'Excel' launch icon on the desktop.", 0, 0, 1280, 768);
 * It is bad idea to use this function if screen size is higher than 1280x768.
 */
function AiRobot_DoScreenRegion( /**string*/ prompt, /**number*/ x, /**number*/ y, /**number*/ w, /**number*/ h, /**number*/ timeout, /**number*/ n_last_images, /**number*/ max_tokens, /**number*/ token_limit)
{
	var success = false;
	_RobotSyncRun(async () => {
		eval(File.IncludeOnce('%WORKDIR%/PageObjects/AiRobot/TargetWindowScreenRegion.js'));
		const navWindow = TargetWindowScreenRegion.FromScreenRegion(x, y, w, h);
		success = await _AiRobotRun(prompt, navWindow, /**number*/ timeout, /**number*/ n_last_images, /**number*/ max_tokens, /**number*/ token_limit);
	});

	return success;
}

var _paramInfoAiRobot_DoScreenRegion = {
	prompt: _AiRobotParamInfo.prompt,
	token_limit: _AiRobotParamInfo.token_limit,
	max_tokens: _AiRobotParamInfo.max_tokens,
	n_last_images: _AiRobotParamInfo.n_last_images,
	timeout: _AiRobotParamInfo.timeout,
};

/**
 * Do fully automation AI interactions first screen.
 * Example 1: AiRobot.DoWindow("Using on-screen calculator find 3+15", "Calculator");
 * It is bad idea to use this function if screen size is higher than 1280x768.
 */
function AiRobot_DoWindow( /**string*/ prompt, /**string*/ window_title, /**number*/ timeout, /**number*/ n_last_images, /**number*/ max_tokens, /**number*/ token_limit)
{
	var success = false;
	_RobotSyncRun(async () => {
		eval(File.IncludeOnce('%WORKDIR%/PageObjects/AiRobot/TargetWindowScreenRegion.js'));
		var foundWindows = null;

		for(var i=0;i<global.g_objectLookupAttempts;i++)
		{
			foundWindows = g_util.FindWindows(window_title, 'regex:.*');
			if(foundWindows && foundWindows.length) break;
			Global.DoSleep(global.g_objectLookupAttemptInterval);
		}
		
		if (foundWindows && foundWindows.length)
		{
			var visibleFound = 0;
			var /**HWNDWrapper*/ wnd = null;
			for (var i = 0; i < foundWindows.length; i++)
			{
				if (foundWindows[i].Visible)
				{
					wnd = foundWindows[i];
					visibleFound++;
				}
			}

			if (wnd)
			{
				if (visibleFound > 1)
				{
					Tester.SoftAssert("AiRobot.DoWindow: Attaching to existing process window: " + window_title, true, ["Using window: " + wnd.Text, "Total windows found: " + foundWindows.length]);
				}

				const navWindow = TargetWindowScreenRegion.FromHWND(wnd);
				success = await _AiRobotRun(prompt, navWindow, /**number*/ timeout, /**number*/ n_last_images, /**number*/ max_tokens, /**number*/ token_limit);
			} else {
				Tester.SoftAssert("AiRobot.DoWindow: None of found windows are visible: " + window_title, false);
			}
		} else {
			Tester.SoftAssert("AiRobot.DoWindow: No window found by title: " + window_title, false);
		}
	});
	return success;
}

var _paramInfoAiRobot_DoWindow = {
	prompt: _AiRobotParamInfo.prompt,
	window_title: {
		description: "Exact window title or regex to match window title, i.e. Calculator or regex:Calc.*"
	},
	token_limit: _AiRobotParamInfo.token_limit,
	max_tokens: _AiRobotParamInfo.max_tokens,
	n_last_images: _AiRobotParamInfo.n_last_images,
	timeout: _AiRobotParamInfo.timeout,
};

/**
 * Do fully automation AI interactions first screen.
 * Example 1:
 *   // Assuming that there is a Notepad object already in the repository, and Notepad is visible on the screen
 *   AiRobot.DoObject("Type 'Hello, world!' to the notepad and save to c:\temp\hello_world.txt", "Notepad");
 * It is bad idea to use this function if screen size is higher than 1280x768.
 * @param {String} prompt parameter description
 */
function AiRobot_DoObject( /**string*/ prompt, /**objectid|SeSObject*/ objectId, /**number*/ timeout, /**number*/ n_last_images, /**number*/ max_tokens, /**number*/ token_limit)
{
	var success = false;
	var obj = SeSWait(objectId, global.g_objectLookupAttempts * global.g_objectLookupAttemptInterval);

	if (!obj)
	{
		Tester.SoftAssert("AiRobot.DoObject: Object Not Found: " + objectId, false);
	} else {
		_RobotSyncRun(async () => {
			eval(File.IncludeOnce('%WORKDIR%/PageObjects/AiRobot/TargetWindowScreenRegion.js'));
			const navWindow = TargetWindowScreenRegion.FromScreenRegion(obj.GetX(), obj.GetY(), obj.GetWidth(), obj.GetHeight());
			success = await _AiRobotRun(prompt, navWindow, /**number*/ timeout, /**number*/ n_last_images, /**number*/ max_tokens, /**number*/ token_limit);
		});
	}

	return success;
}

var _paramInfoAiRobot_DoObject = {
	prompt: _AiRobotParamInfo.prompt,
	object_id: {
		description: "Object whose screen rectangle will be shown to AI robot to interact with."
	},
	token_limit: _AiRobotParamInfo.token_limit,
	max_tokens: _AiRobotParamInfo.max_tokens,
	n_last_images: _AiRobotParamInfo.n_last_images,
	timeout: _AiRobotParamInfo.timeout,
};
