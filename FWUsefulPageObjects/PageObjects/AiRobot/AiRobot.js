/**
 * @PageObject AiRobot. Implements fully-automatic interactions with target window or screen region (keyboard and mouse). Should be used when AI is unable to
 * find reasonable entries in other page objects. This way of interacting is last resort. It may be applied to complex, exploratory style actions.
 * @Version 0.0.7
 */
SeSPageObject("AiRobot");

function _RobotSyncRun(f) {
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

function _extractFirstEntryAfterCallLog(callStack) {
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
		const npmCmd = g_helper.ResolvePath("InstrumentJS/npm.cmd");
		Global.DoCmd('"' + npmCmd + '"' + " install sharp --prefix \"" + g_workDir + "\"", g_workDir, true, false);
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
		defaultValue: 30000
	},
	_returns: '`true` if the upload was successful; otherwise, it returns `false`.'
};

async function _AiRobotRun(prompt, targetWindow, /**number*/ timeout, /**number*/ n_last_images, /**number*/ max_tokens, /**number*/ token_limit)
{
	_AiRobotInit();
	var p = File.ResolvePath('%WORKDIR%/PageObjects/AiRobot/ComputerUseImpl.js')
	const ComputerUseImplClass = require(p).ComputerUseImpl;
	const status = await ComputerUseImplClass.toolUseLoop(prompt, targetWindow, max_tokens, n_last_images, timeout, token_limit);
	Tester.Assert("AiRobot done: " + prompt, true, [JSON.stringify(status, null, 2)])
	return status && status.success;
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
		//Navigator.Open("https://v3.libraryinformationsystem.org/");
		Navigator.Open("");
		const navWindow = TargetWindowScreenRegion.FromWebDriver();
		success = await _AiRobotRun(prompt, navWindow, /**number*/ timeout, /**number*/ n_last_images, /**number*/ max_tokens, /**number*/ token_limit);
	});

	return success;
}

var _paramInfoAiRobot_DoWebBrowser = {
	prompt: _AiRobotParamInfo.Message,
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
		//Navigator.Open("https://v3.libraryinformationsystem.org/");
		const navWindow = TargetWindowScreenRegion.FromScreen();
		success = _AiRobotRun(prompt, navWindow, /**number*/ timeout, /**number*/ n_last_images, /**number*/ max_tokens, /**number*/ token_limit);
	});

	return success;
}

var _paramInfoAiRobot_DoFullScreen = {
	prompt: _AiRobotParamInfo.Message,
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
		success = _AiRobotRun(prompt, navWindow, /**number*/ timeout, /**number*/ n_last_images, /**number*/ max_tokens, /**number*/ token_limit);
	});

	return success;
}

var _paramInfoAiRobot_DoScreenRegion = {
	prompt: _AiRobotParamInfo.Message,
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
		var foundWindows = g_util.FindWindows(window_title, 'regex:.*');

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

				const navWindow = TargetWindowScreenRegion.FromHwnd(wnd);
				success = _AiRobotRun(prompt, navWindow, /**number*/ timeout, /**number*/ n_last_images, /**number*/ max_tokens, /**number*/ token_limit);
			} else {
				Tester.SoftAssert("AiRobot.DoWindow: None of found windows are visible: " + window_title, false);
			}
		} else {
			Tester.SoftAssert("AiRobot.DoWindow: Now window found by title: " + window_title, true, ["Using window: " + wnd.Text, "Total windows found: " + foundWindows.length]);
		}
	});
	return success;
}

var _paramInfoAiRobot_DoWindow = {
	prompt: _AiRobotParamInfo.Message,
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
			success = _AiRobotRun(prompt, navWindow, /**number*/ timeout, /**number*/ n_last_images, /**number*/ max_tokens, /**number*/ token_limit);
		});
	}

	return success;
}

var _paramInfoAiRobot_DoObject = {
	prompt: _AiRobotParamInfo.Message,
	object_id: {
		description: "Object whose screen rectangle will be shown to AI robot to interact with."
	},
	token_limit: _AiRobotParamInfo.token_limit,
	max_tokens: _AiRobotParamInfo.max_tokens,
	n_last_images: _AiRobotParamInfo.n_last_images,
	timeout: _AiRobotParamInfo.timeout,
};
