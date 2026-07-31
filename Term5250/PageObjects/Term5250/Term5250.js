/**
 * @PageObject Term5250 - AS/400 5250 Terminal Emulator Interface via EHLLAPI
 * @Version 0.0.3
 * 
 * Uses EHLLAPI (Emulator High-Level Language API) to communicate with 
 * IBM iAccess Client Solutions or IBM Personal Communications for AS/400.
 */
SeSPageObject("Term5250");

// --- Configuration -----------------------------------------------------------
var g_term5250Hwnd = null;
var g_sessionId = "A"; // Default session short name (A-Z)
var g_term5250Connected = false; // Connection state for lazy init

// Screen dimensions for 5250 terminal
var SCREEN_ROWS = 24;
var SCREEN_COLS = 80;
var PS_SIZE = SCREEN_ROWS * SCREEN_COLS; // 1920 bytes

// EHLLAPI DLL path - can be overridden via environment or configuration
var g_ehllDllPath = "%EHLLAPI_DLL%";
if (!g_ehllDllPath || g_ehllDllPath == "%EHLLAPI_DLL%") {
	g_ehllDllPath = "C:\\Program Files (x86)\\IBM\\EHLLAPI\\pcshll32.dll";
}

// --- EHLLAPI Function Numbers ------------------------------------------------

var EHLL_FUNC = {
	ConnectPS: 1,
	DisconnectPS: 2,
	SendKey: 3,
	Wait: 4,
	CopyPS: 5,
	SearchPS: 6,
	QueryCursorLoc: 7,
	CopyPSToString: 8,
	SetSessionParameters: 9,
	QuerySessions: 10,
	Reserve: 11,
	Release: 12,
	CopyOIA: 13,
	GetKey: 20,
	QuerySessionStatus: 22,
	StartHostNotify: 23,
	QueryHostUpdate: 24,
	StopHostNotify: 25,
	SetCursorPos: 40,
	SendFile: 90,
	ReceiveFile: 91,
	CopyFieldToString: 34,
	CopyStringToField: 33
};

// --- EHLLAPI Return Code Descriptions ----------------------------------------

var EHLL_RC_DESC = {
	0: "OK",
	1: "Invalid host PS position",
	2: "Parameter error",
	4: "Busy (keyboard locked)",
	5: "Input inhibited",
	7: "PS position not field",
	8: "No prior Connect",
	9: "System error",
	10: "Function not available",
	11: "Resource unavailable",
	24: "Unformatted PS"
};

// --- EHLLAPI Key Mnemonics ---------------------------------------------------

var EHLL_KEYS = {
	Enter: "@E",
	Tab: "@T",
	BackTab: "@B",
	Clear: "@C",
	Delete: "@D",
	EraseEOF: "@F",
	EraseInput: "@A@F",
	FieldMark: "@;",
	Help: "@H",
	Home: "@0",
	Insert: "@I",
	NewLine: "@N",
	PageUp: "@u",
	PageDown: "@v",
	Reset: "@R",
	SysRequest: "@A@H",
	F1: "@1",
	F2: "@2",
	F3: "@3",
	F4: "@4",
	F5: "@5",
	F6: "@6",
	F7: "@7",
	F8: "@8",
	F9: "@9",
	F10: "@a",
	F11: "@b",
	F12: "@c",
	F13: "@d",
	F14: "@e",
	F15: "@f",
	F16: "@g",
	F17: "@h",
	F18: "@i",
	F19: "@j",
	F20: "@k",
	F21: "@l",
	F22: "@m",
	F23: "@n",
	F24: "@o",
	Attn: "@A@Q",
	PrintScreen: "@P"
};

// --- Internal: EHLLAPI via koffi ---------------------------------------------

var g_koffi = null;
var g_Buffer = null;
var g_ehllLib = null;
var g_ehllFunc = null;

function _Term5250_LoadDll()
{
	if (g_ehllFunc) return true;

	try {
		const koffi = require('koffi');
	} catch (e) {
		Log("koffi not installed, doing npm install");
		var npmCmd = g_helper.ResolvePath("InstrumentJS/npm.cmd") || 'npm';
		Global.DoCmd('"' + npmCmd + '"' + " install koffi --prefix \"" + g_workDir + "\"", g_workDir, true, false);
	}

	try {
		if (!g_koffi) {
			g_koffi = require("koffi");
			g_Buffer = require("buffer").Buffer;
		}
		g_ehllLib = g_koffi.load(g_ehllDllPath);
		g_ehllFunc = g_ehllLib.func("__stdcall", "hllapi", "long", ["int *", "char *", "int *", "int *"]);
		Log("EHLLAPI DLL loaded: " + g_ehllDllPath);
		return true;
	} catch (e) {
		Tester.Assert("Failed to load EHLLAPI DLL: " + g_ehllDllPath, false, e.message);
		return false;
	}
}

function _Term5250_CallEhllapi( /**number*/ funcNum, /**string*/ data, /**number*/ length)
{
	if (!_Term5250_LoadDll()) {
		return { rc: 9, length: 0, data: "", error: "DLL not loaded" };
	}

	var fnBuf = g_Buffer.alloc(4);
	var lenBuf = g_Buffer.alloc(4);
	var rcBuf = g_Buffer.alloc(4);

	var bufLen = Math.max(length || 4, (data || "").length, 4);
	var dataBuf = g_Buffer.alloc(bufLen, " ");
	if (data) {
		dataBuf.write(data, 0, "ascii");
	}

	fnBuf.writeInt32LE(funcNum);
	lenBuf.writeInt32LE(length || bufLen);
	rcBuf.writeInt32LE(0);

	try {
		g_ehllFunc(fnBuf, dataBuf, lenBuf, rcBuf);

		var result = {
			rc: rcBuf.readInt32LE(0),
			length: lenBuf.readInt32LE(0),
			data: dataBuf.toString("ascii", 0, bufLen)
		};

		if (l2) Log2("EHLLAPI func=" + funcNum + " len=" + length + " => rc=" + result.rc);
		return result;
	} catch (e) {
		Log("EHLLAPI call error: " + e.message);
		return { rc: 9, length: 0, data: "", error: e.message };
	}
}

function _Term5250_RcToString( /**number*/ rc)
{
	return EHLL_RC_DESC[rc] || ("Unknown (" + rc + ")");
}

function _Term5250_EnsureConnected()
{
	if (g_term5250Connected) return true;
	Log("Auto-connecting to terminal session...");
	return Term5250_FindOrAttach(g_sessionId, true);
}

// --- Public API --------------------------------------------------------------

function Term5250_FindOrAttach( /**string*/ sessionId, /**boolean*/ bAttach)
{
	sessionId = sessionId || g_sessionId;
	g_sessionId = sessionId;

	var processNames = ["acslaunch_win-64.exe", "acslaunch_win-32.exe", "pcsws.exe", "pcscm.exe"];
	var pid = null;

	for (var i = 0; i < processNames.length; i++) {
		pid = g_helper.FindProcess(processNames[i], "");
		if (pid) {
			Log("Found terminal process: " + processNames[i] + " (PID: " + pid + ")");
			break;
		}
	}

	if (!pid) {
		if (bAttach) {
			Tester.Assert('Terminal process is not started.', false);
			return false;
		}
		Tester.Assert('No 5250 terminal emulator found. Please start IBM iAccess Client Solutions.', false);
		return false;
	}

	for (var j = 0; j < 100; j++) {
		g_term5250Hwnd = g_util.GetProcessMainWindow(pid);
		if (g_term5250Hwnd) break;
		Global.DoSleep(100);
	}

	if (g_term5250Hwnd) {
		Log("Terminal HWND: " + g_term5250Hwnd);
		g_term5250Hwnd.Restore();
		return Term5250_ConnectPS(sessionId);
	}

	Tester.Assert('Unable to attach to terminal window.', false, "PID: " + pid);
	return false;
}
var _paramInfoTerm5250_FindOrAttach = {
	_: function () { /*** Find or attach to the 5250 terminal emulator session. Connects via EHLLAPI.*/ },
	sessionId: { description: "Session short name (A-Z). Default is 'A'.", optional: true },
	bAttach: { description: "If `true`, only attach to existing session.", optional: true }
};

function Term5250_ConnectPS( /**string*/ sessionId)
{
	sessionId = sessionId || g_sessionId;

	// Try to disconnect first in case of stale connection
	_Term5250_CallEhllapi(EHLL_FUNC.DisconnectPS, sessionId, 4);

	var result = _Term5250_CallEhllapi(EHLL_FUNC.ConnectPS, sessionId, 4);

	if (result.rc !== 0) {
		g_term5250Connected = false;
		Tester.Assert("Connect PS failed: " + _Term5250_RcToString(result.rc), false);
		return false;
	}

	g_term5250Connected = true;
	Log("Connected to session '" + sessionId + "'");
	return true;
}
var _paramInfoTerm5250_ConnectPS = {
	_: function () { /*** Connect to the terminal presentation space.*/ },
	sessionId: { description: "Session short name (A-Z).", optional: true }
};

function Term5250_DisconnectPS( /**string*/ sessionId)
{
	sessionId = sessionId || g_sessionId;
	var result = _Term5250_CallEhllapi(EHLL_FUNC.DisconnectPS, sessionId, 4);

	g_term5250Connected = false;

	if (result.rc !== 0) {
		Log("Disconnect PS warning: " + _Term5250_RcToString(result.rc));
	} else {
		Log("Disconnected from session '" + sessionId + "'");
	}
	return result.rc === 0;
}
var _paramInfoTerm5250_DisconnectPS = {
	_: function () { /*** Disconnect from the terminal presentation space.*/ },
	sessionId: { description: "Session short name (A-Z).", optional: true }
};

function Term5250_QuerySessions()
{
	var sessions = [];
	var result = _Term5250_CallEhllapi(EHLL_FUNC.QuerySessions, "", 240);

	if (result.rc === 0 && result.length > 0) {
		var numSessions = Math.floor(result.length / 12);
		for (var i = 0; i < numSessions; i++) {
			var entry = result.data.substring(i * 12, (i + 1) * 12);
			sessions.push({
				id: entry.charAt(0),
				name: entry.substring(1, 9).trim(),
				type: entry.charAt(9),
				size: parseInt(entry.substring(10, 12), 10) || PS_SIZE
			});
		}
	}
	return sessions;
}
var _paramInfoTerm5250_QuerySessions = {
	_: function () { /*** Query available terminal sessions. Returns array of session objects.*/ }
};

function Term5250_CopyPS()
{
	_Term5250_EnsureConnected();
	var result = _Term5250_CallEhllapi(EHLL_FUNC.CopyPS, "", PS_SIZE);

	if (result.rc !== 0 && result.rc !== 4 && result.rc !== 5) {
		Log("Copy PS warning: " + _Term5250_RcToString(result.rc));
	}
	return result.data.substring(0, PS_SIZE);
}
var _paramInfoTerm5250_CopyPS = {
	_: function () { /*** Copy the entire presentation space (screen contents). Returns screen as string.*/ }
};

function Term5250_GetScreenRows()
{
	var screenData = Term5250_CopyPS();
	var rows = [];
	for (var i = 0; i < SCREEN_ROWS; i++) {
		rows.push(screenData.substring(i * SCREEN_COLS, (i + 1) * SCREEN_COLS));
	}
	return rows;
}
var _paramInfoTerm5250_GetScreenRows = {
	_: function () { /*** Get screen contents as array of row strings.*/ }
};

function Term5250_GetTextAt( /**number*/ row, /**number*/ col, /**number*/ length)
{
	var screenData = Term5250_CopyPS();
	var pos = ((row - 1) * SCREEN_COLS) + (col - 1);
	return screenData.substring(pos, pos + length);
}
var _paramInfoTerm5250_GetTextAt = {
	_: function () { /*** Get text at a specific screen position.*/ },
	row: { description: "Row number (1-based)." },
	col: { description: "Column number (1-based)." },
	length: { description: "Number of characters to read." }
};

function Term5250_GetCursorPos()
{
	_Term5250_EnsureConnected();
	var result = _Term5250_CallEhllapi(EHLL_FUNC.QueryCursorLoc, "", 4);

	if (result.rc === 0) {
		var pos = result.length;
		var row = Math.floor((pos - 1) / SCREEN_COLS) + 1;
		var col = ((pos - 1) % SCREEN_COLS) + 1;
		return { row: row, col: col, pos: pos };
	}
	return { row: 1, col: 1, pos: 1 };
}
var _paramInfoTerm5250_GetCursorPos = {
	_: function () { /*** Get current cursor position. Returns object with row, col, pos.*/ }
};

function Term5250_SetCursorPos( /**number*/ row, /**number*/ col)
{
	_Term5250_EnsureConnected();
	var pos = ((row - 1) * SCREEN_COLS) + col;
	var result = _Term5250_CallEhllapi(EHLL_FUNC.SetCursorPos, "", pos);

	if (result.rc !== 0) {
		Log("SetCursorPos warning: " + _Term5250_RcToString(result.rc));
		return false;
	}
	return true;
}
var _paramInfoTerm5250_SetCursorPos = {
	_: function () { /*** Set cursor position on screen.*/ },
	row: { description: "Row number (1-based)." },
	col: { description: "Column number (1-based)." }
};

function Term5250_SendKey( /**string*/ keyName)
{
	_Term5250_EnsureConnected();
	var keyStr = EHLL_KEYS[keyName] || keyName;
	var result = _Term5250_CallEhllapi(EHLL_FUNC.SendKey, keyStr, keyStr.length);

	if (result.rc !== 0 && result.rc !== 4 && result.rc !== 5) {
		Log("SendKey warning: " + _Term5250_RcToString(result.rc));
		return false;
	}
	Global.DoSleep(150);
	return true;
}
var _paramInfoTerm5250_SendKey = {
	_: function () { /*** Send a key to terminal. Supports Enter, Tab, F1-F24, etc.*/ },
	keyName: {
		description: "Key name or raw EHLLAPI mnemonic.",
		binding: "enum",
		enumOpts: [
            ["Enter"], ["Tab"], ["BackTab"], ["Clear"], ["Delete"],
            ["EraseEOF"], ["EraseInput"], ["Help"], ["Home"], ["Insert"],
            ["NewLine"], ["PageUp"], ["PageDown"], ["Reset"], ["SysRequest"],
            ["F1"], ["F2"], ["F3"], ["F4"], ["F5"], ["F6"],
            ["F7"], ["F8"], ["F9"], ["F10"], ["F11"], ["F12"],
            ["F13"], ["F14"], ["F15"], ["F16"], ["F17"], ["F18"],
            ["F19"], ["F20"], ["F21"], ["F22"], ["F23"], ["F24"],
            ["Attn"], ["PrintScreen"]
        ]
	}
};

function Term5250_SendCommand( /**string*/ cmd)
{
	// Handle PF(n) or F(n) format for compatibility with Term
	var pfMatch = cmd.match(/^(?:PF|F)\((\d+)\)$/i);
	if (pfMatch) {
		return Term5250_PressF(parseInt(pfMatch[1], 10));
	}
	return Term5250_SendKey(cmd);
}
var _paramInfoTerm5250_SendCommand = {
	_: function () { /*** Send a command (key) to terminal. Supports PF(n) or F(n) format. Alias for SendKey for compatibility with Term.*/ },
	cmd: {
		description: "Command/key name, PF(n), F(n), or raw EHLLAPI mnemonic.",
		binding: "enum",
		enumOpts: [
            ["Enter"], ["Tab"], ["BackTab"], ["Clear"], ["Delete"],
            ["EraseEOF"], ["EraseInput"], ["Help"], ["Home"], ["Insert"],
            ["NewLine"], ["PageUp"], ["PageDown"], ["Reset"], ["SysRequest"],
            ["F1"], ["F2"], ["F3"], ["F4"], ["F5"], ["F6"],
            ["F7"], ["F8"], ["F9"], ["F10"], ["F11"], ["F12"],
            ["F13"], ["F14"], ["F15"], ["F16"], ["F17"], ["F18"],
            ["F19"], ["F20"], ["F21"], ["F22"], ["F23"], ["F24"],
            ["PF(1)"], ["PF(2)"], ["PF(3)"], ["PF(4)"], ["PF(5)"], ["PF(6)"],
            ["PF(7)"], ["PF(8)"], ["PF(9)"], ["PF(10)"], ["PF(11)"], ["PF(12)"],
            ["Attn"], ["PrintScreen"]
        ]
	}
};

function Term5250_SendString( /**string*/ str)
{
	_Term5250_EnsureConnected();
	var result = _Term5250_CallEhllapi(EHLL_FUNC.SendKey, str, str.length);

	if (result.rc !== 0 && result.rc !== 4 && result.rc !== 5) {
		Log("SendString warning: " + _Term5250_RcToString(result.rc));
		return false;
	}
	Global.DoSleep(150);
	return true;
}
var _paramInfoTerm5250_SendString = {
	_: function () { /*** Send a string of text to terminal.*/ },
	str: { description: "Text string to send." }
};

function Term5250_SendStringEnter( /**string*/ str)
{
	Term5250_SendString(str);
	return Term5250_SendKey("Enter");
}
var _paramInfoTerm5250_SendStringEnter = {
	_: function () { /*** Send string followed by Enter key.*/ },
	str: { description: "Text string to send before Enter." }
};

function Term5250_WaitReady( /**number*/ timeout)
{
	_Term5250_EnsureConnected();
	timeout = timeout || 5000;
	var result = _Term5250_CallEhllapi(EHLL_FUNC.Wait, "", timeout);
	return (result.rc === 0);
}
var _paramInfoTerm5250_WaitReady = {
	_: function () { /*** Wait for terminal to become ready (keyboard unlocked).*/ },
	timeout: { description: "Timeout in milliseconds. Default 5000.", optional: true }
};

function Term5250_SearchPS( /**string*/ text, /**number*/ startPos)
{
	_Term5250_EnsureConnected();
	startPos = startPos || 1;
	var result = _Term5250_CallEhllapi(EHLL_FUNC.SearchPS, text, startPos);

	if (result.rc === 0) {
		return result.length;
	}
	return 0;
}
var _paramInfoTerm5250_SearchPS = {
	_: function () { /*** Search for text on screen. Returns position (1-based) or 0.*/ },
	text: { description: "Text to search for." },
	startPos: { description: "Starting position (1-based). Default 1.", optional: true }
};

function Term5250_EnsureText( /**string*/ text, /**number*/ timeout, /**boolean*/ failIfNotFound)
{
	timeout = timeout || 1000;
	var start = new Date();
	var screenText = Term5250_CopyPS();

	while (("" + screenText).indexOf(text) < 0) {
		if ((new Date() - start) > timeout) {
			if (failIfNotFound) {
				var formattedScreen = Term5250_GetScreenRows().join("\n");
				Tester.Assert('Failed to find text: ' + text, false,
					new SeSReportText(formattedScreen, "Screen text"));
			}
			return false;
		}
		Global.DoSleep(100);
		screenText = Term5250_CopyPS();
	}

	Tester.Assert('Found text: ' + text, true, new SeSReportText(screenText, "Screen text"));
	return true;
}
var _paramInfoTerm5250_EnsureText = {
	_: function () { /*** Ensure text is present on screen with timeout.*/ },
	text: { description: "Text to find." },
	timeout: { description: "Timeout in milliseconds. Default 1000.", optional: true },
	failIfNotFound: { description: "If `true`, assert failure when not found.", optional: true }
};

function Term5250_Screenshot( /**string*/ comment)
{
	_Term5250_EnsureConnected();

	if (g_term5250Hwnd) {
		g_term5250Hwnd.Restore();
		var img = SeSCaptureImageDefaultImpl(
			g_term5250Hwnd.PosX, g_term5250Hwnd.PosY,
			g_term5250Hwnd.PosWidth, g_term5250Hwnd.PosHeight, false
		);
		Tester.Message(comment, new SeSReportImage(img, "Screen"));
	} else {
		var formattedScreen = Term5250_GetScreenRows().join("\n");
		Tester.Message(comment, new SeSReportText(formattedScreen, "Screen text"));
	}
}
var _paramInfoTerm5250_Screenshot = {
	_: function () { /*** Take a screenshot of terminal window.*/ },
	comment: { description: "Comment for the screenshot." }
};

function Term5250_TypeAt( /**number*/ row, /**number*/ col, /**string*/ text)
{
	Term5250_SetCursorPos(row, col);
	Term5250_SendString(text);
}
var _paramInfoTerm5250_TypeAt = {
	_: function () { /*** Move cursor to position and type text.*/ },
	row: { description: "Row number (1-based)." },
	col: { description: "Column number (1-based)." },
	text: { description: "Text to type." }
};

function Term5250_ClearField()
{
	return Term5250_SendKey("EraseEOF");
}
var _paramInfoTerm5250_ClearField = {
	_: function () { /*** Clear the current field (Erase EOF).*/ }
};

function Term5250_ClearAndType( /**string*/ text)
{
	Term5250_ClearField();
	return Term5250_SendString(text);
}
var _paramInfoTerm5250_ClearAndType = {
	_: function () { /*** Clear current field and type new text.*/ },
	text: { description: "Text to type." }
};

function Term5250_PressF( /**number*/ fkeyNum)
{
	var keyName = "F" + fkeyNum;
	return Term5250_SendKey(keyName);
}
var _paramInfoTerm5250_PressF = {
	_: function () { /*** Press a function key (F1-F24).*/ },
	fkeyNum: { description: "Function key number (1-24)." }
};

function Term5250_WaitForScreen( /**string*/ screenText, /**number*/ timeout)
{
	timeout = timeout || 10000;
	return Term5250_EnsureText(screenText, timeout, false);
}
var _paramInfoTerm5250_WaitForScreen = {
	_: function () { /*** Wait for a specific screen by checking for text.*/ },
	screenText: { description: "Text that identifies the screen." },
	timeout: { description: "Timeout in milliseconds. Default 10000.", optional: true }
};

function Term5250_Login( /**string*/ userId, /**string*/ password, /**string*/ loginPrompt)
{
	loginPrompt = loginPrompt || "Sign On";

	if (!Term5250_WaitForScreen(loginPrompt, 10000)) {
		Tester.Assert("Login screen not found", false);
		return false;
	}

	Term5250_SendString(userId);
	Term5250_SendKey("Tab");
	Term5250_SendString(password);
	Term5250_SendKey("Enter");
	Term5250_WaitReady(5000);
	return true;
}
var _paramInfoTerm5250_Login = {
	_: function () { /*** Login to AS/400 system.*/ },
	userId: { description: "User ID." },
	password: { description: "Password." },
	loginPrompt: { description: "Text to identify login screen. Default 'Sign On'.", optional: true }
};

function Term5250_RunCommand( /**string*/ command)
{
	Term5250_SendString(command);
	Term5250_SendKey("Enter");
	Term5250_WaitReady(5000);
}
var _paramInfoTerm5250_RunCommand = {
	_: function () { /*** Execute an AS/400 command.*/ },
	command: { description: "AS/400 command to execute." }
};

function Term5250_SelectMenuOption( /**string*/ option)
{
	Term5250_SendString(option);
	Term5250_SendKey("Enter");
	Term5250_WaitReady(3000);
}
var _paramInfoTerm5250_SelectMenuOption = {
	_: function () { /*** Navigate to a menu option.*/ },
	option: { description: "Menu option number or code." }
};

function Term5250_SetDllPath( /**string*/ dllPath)
{
	g_ehllDllPath = dllPath;
	g_ehllLib = null;
	g_ehllFunc = null;
	Log("EHLLAPI DLL path set to: " + dllPath);
}
var _paramInfoTerm5250_SetDllPath = {
	_: function () { /*** Set the EHLLAPI DLL path.*/ },
	dllPath: { description: "Full path to the EHLLAPI DLL." }
};

function Term5250_SetSessionId( /**string*/ sessionId)
{
	g_sessionId = sessionId;
	Log("Session ID set to: " + sessionId);
}
var _paramInfoTerm5250_SetSessionId = {
	_: function () { /*** Set the default session ID.*/ },
	sessionId: { description: "Session short name (A-Z)." }
};

function Term5250_GetScreenDimensions()
{
	return { rows: SCREEN_ROWS, cols: SCREEN_COLS, size: PS_SIZE };
}
var _paramInfoTerm5250_GetScreenDimensions = {
	_: function () { /*** Get screen dimensions. Returns object with rows, cols, size.*/ }
};

function Term5250_DumpScreen()
{
	var rows = Term5250_GetScreenRows();
	Log("-".repeat(SCREEN_COLS));
	Log(" Screen contents of session '" + g_sessionId + "'");
	Log("-".repeat(SCREEN_COLS));

	for (var i = 0; i < rows.length; i++) {
		var lineNum = ("0" + (i + 1)).slice(-2);
		Log(lineNum + "ï¿½" + rows[i] + "ï¿½");
	}
	Log("-".repeat(SCREEN_COLS));
}
var _paramInfoTerm5250_DumpScreen = {
	_: function () { /*** Print screen contents to log.*/ }
};

function Term5250_GetMessageLine()
{
	return Term5250_GetTextAt(24, 1, SCREEN_COLS).trim();
}
var _paramInfoTerm5250_GetMessageLine = {
	_: function () { /*** Get the message line text (row 24).*/ }
};

function Term5250_IsKeyboardLocked()
{
	_Term5250_EnsureConnected();
	var result = _Term5250_CallEhllapi(EHLL_FUNC.Wait, "", 0);
	return (result.rc === 4 || result.rc === 5);
}
var _paramInfoTerm5250_IsKeyboardLocked = {
	_: function () { /*** Check if keyboard is locked.*/ }
};
