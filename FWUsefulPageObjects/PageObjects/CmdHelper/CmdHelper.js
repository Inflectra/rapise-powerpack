/**
 * @PageObject CmdHelper object is supposed to help executing complex and chained processes.

```
netstat -n | FINDSTR TCP | find /c /v ""

netstat -n | grep TCP | wc -l

// Run it as a whole
CmdHelper.DoCmd('netstat -n | findstr TCP | find /c /v ""');
CmdHelper.VerifySuccess();

// Run it per OS
CmdHelper.DoCmdWin('netstat -n | findstr TCP | find /c /v ""');
CmdHelper.DoCmdLin('netstat -n | grep TCP | wc -l');
CmdHelper.VerifySuccess();

// Or access intermediate results:
CmdHelper.Pipe('netstat -n');
CmdHelper.Pipe('findstr TCP');
CmdHelper.DoCmd('find /c /v ""');
var netstatOutput = CmdHelper.GetStdOut(0);
var findStrOutput = CmdHelper.GetStdOut(1);
var finalOutput = CmdHelper.GetStdOut(); // The same as GetStdOut(2);

// Effectively mix linux and win commands for the test to work on each environment:
CmdHelper.Pipe('netstat -n'); // will run on both
CmdHelper.PipeLin('grep TCP');
CmdHelper.PipeWin('findstr TCP');
CmdHelper.PipeLin('find /c /v ""');
CmdHelper.PipeWin('wc -l');
CmdHelper.DoCmd();
CmdHelper.VerifySuccess();
```

@Version 1.0.1
 */
 
SeSPageObject("CmdHelper");

// Module refs (lazy-loaded)
var _cmdhelper_fs = null;
var _cmdhelper_path = null;
var _cmdhelper_os = null;
var _cmdhelper_cp = null;

/**
 * @private
 * Lazy initialization. Called from every public CmdHelper_* function.
 */
function _CmdHelper_Init()
{
	if (_cmdhelper_fs) return; // already initialized
	_cmdhelper_fs = require('fs');
	_cmdhelper_path = require('path');
	_cmdhelper_os = require('os');
	_cmdhelper_cp = require('child_process');
	CmdHelper._pipeStack = [];
	CmdHelper._results = [];
	CmdHelper._tempFiles = [];

	if (!global.sync) {
		global.sync = function (promise, timeout, verbose = true)
		{
			timeout = timeout || 60000;
			var _resolved = false;
			var _res = undefined;

			async function _worker(promise)
			{
				try
				{
					_res = await promise;
				}
				catch (e)
				{
					if (verbose)
					{
						Log(e.message);
					}
				}
				_resolved = true;
			}

			_worker(promise);

			var _endOfWait = Date.now() + timeout;
			while (!_resolved)
			{
				if (timeout == -1 || Date.now() < _endOfWait)
				{
					WScript.Sleep(1);
				}
				else
				{
					Log("Timeout in global.sync");
					WScript.Sleep(10);
				}
			}

			return _res;
		}
	}

}

/**
 * @private
 * Create a temp file path and register it for cleanup.
 */
function _CmdHelper_MakeTempPath( /**string*/ suffix)
{
	var name = 'cmdhelper_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10) + (suffix || '.tmp');
	var p = _cmdhelper_path.join(_cmdhelper_os.tmpdir(), name);
	CmdHelper._tempFiles.push(p);
	return p;
}

/**
 * @private
 * Delete a file if it exists, ignoring errors.
 */
function _CmdHelper_DeleteTemp( /**string*/ filePath)
{
	try {
		if (_cmdhelper_fs.existsSync(filePath)) {
			_cmdhelper_fs.unlinkSync(filePath);
		}
	} catch (e) {}
}

/**
 * @private
 * Clear the pipe stack, remove all registered temp files,
 * and clean up stale cmdhelper_* temp files older than 24 hours.
 */
function _CmdHelper_ClearPipeStack()
{
	for (var i = 0; i < CmdHelper._tempFiles.length; i++) {
		_CmdHelper_DeleteTemp(CmdHelper._tempFiles[i]);
	}
	CmdHelper._tempFiles = [];

	// Clean up stale temp files from previous runs (older than 24h)
	var cutoff = Date.now() - 24 * 60 * 60 * 1000;
	try {
		var tmpDir = _cmdhelper_os.tmpdir();
		var files = _cmdhelper_fs.readdirSync(tmpDir);
		for (var j = 0; j < files.length; j++) {
			var match = /^cmdhelper_(\d+)_/.exec(files[j]);
			if (match) {
				var ts = parseInt(match[1], 10);
				if (ts < cutoff) {
					_CmdHelper_DeleteTemp(_cmdhelper_path.join(tmpDir, files[j]));
				}
			}
		}
	} catch(e) {}
}

/**
 * @private
 * Run a single command synchronously with stdout/stderr captured in memory.
 * Optionally writes stdout to outPath and stderr to errPath.
 * If prevOutFile is provided, pipes its content as stdin.
 * Returns {exitCode, stdout, stderr, combined} where combined is interleaved.
 */
function _CmdHelper_RunOne(/**string*/cmd, /**string*/outPath, /**string*/errPath, /**string*/prevOutFile)
{
	var fullCmd = cmd;
	if (prevOutFile) {
		var isWin = (process.platform === 'win32');
		var catCmd = isWin ? 'type "' + prevOutFile.replace(/\//g, '\\') + '"' : 'cat "' + prevOutFile + '"';
		fullCmd = catCmd + ' | ' + cmd;
	}

	return _CmdHelper_Exec(fullCmd, outPath, errPath);
}

/**
 * @private
 * Run a full pipeline (array of chain entries) as a single native shell command.
 * Each entry: {cmd, stdoutFile, stderrFile, skip}.
 * Uses real shell pipes (|) so data flows line-by-line between processes.
 * Per-step capture is done via tee (Unix) or PowerShell Tee-Object (Windows) for
 * intermediate steps that request file output.
 * Returns {exitCode, results[]} where each result has {stdout, stderr, combined, skipped, exitCode}.
 */
function _CmdHelper_RunChain(/**object[]*/chain)
{
	var isWin = (process.platform === 'win32');
	var results = [];

	// Build the native pipeline command
	// For intermediate steps with user-specified output files, insert tee.
	// The final step's stdout/stderr are captured from the spawned process.
	var parts = [];
	for (var i = 0; i < chain.length; i++) {
		var entry = chain[i];
		var isLast = (i === chain.length - 1);
		var cmdPart = entry.cmd;

		if (!isLast && entry.outPath) {
			// Intermediate step needs its output saved to a file AND piped forward.
			if (entry.outPath === entry.errPath) {
				// Both streams to same file: redirect stderr into stdout, then tee
				if (isWin) {
					cmdPart = '(' + cmdPart + ' 2>&1 ) | powershell -NoProfile -Command "$input | Tee-Object -FilePath \'' + entry.outPath.replace(/'/g, "''") + '\'"';
				} else {
					cmdPart = '(' + cmdPart + ') 2>&1 | tee "' + entry.outPath + '"';
				}
			} else {
				// Tee stdout to file, stderr goes to its own file if specified
				var errRedir = '';
				if (entry.errPath) {
					errRedir = isWin
						? ' 2>"' + entry.errPath + '"'
						: ' 2>"' + entry.errPath + '"';
				}
				if (isWin) {
					cmdPart = '(' + cmdPart + errRedir + ') | powershell -NoProfile -Command "$input | Tee-Object -FilePath \'' + entry.outPath.replace(/'/g, "''") + '\'"';
				} else {
					cmdPart = '(' + cmdPart + errRedir + ') | tee "' + entry.outPath + '"';
				}
			}
		} else if (!isLast) {
			// Intermediate step with no file capture — just pipe through
			// stderr for intermediate steps with errPath still needs redirect
			if (entry.errPath) {
				cmdPart = '(' + cmdPart + ') 2>"' + entry.errPath + '"';
			}
		}

		parts.push(cmdPart);
	}

	var pipeline = parts.join(' | ');

	// For the final step, determine file paths for the exec call
	var last = chain[chain.length - 1];
	var finalOutPath = last.outPath || null;
	var finalErrPath = last.errPath || null;

	// Execute the full pipeline
	var execResult = _CmdHelper_Exec(pipeline, finalOutPath, finalErrPath);

	// Build per-step results
	for (var j = 0; j < chain.length; j++) {
		var e = chain[j];
		var isLastStep = (j === chain.length - 1);

		// Build the full pipeline command up to and including this step
		var pipelineUpTo = [];
		for (var k = 0; k <= j; k++) {
			pipelineUpTo.push(chain[k].cmd);
		}
		var fullCmd = pipelineUpTo.join(' | ');

		if (e.skip) {
			results.push({ cmd: fullCmd, stdout: null, stderr: null, combined: null, skipped: true, exitCode: isLastStep ? execResult.exitCode : 0 });
		} else if (isLastStep) {
			results.push({ cmd: fullCmd, stdout: execResult.stdout, stderr: execResult.stderr, combined: execResult.combined, skipped: false, exitCode: execResult.exitCode });
		} else {
			// Read captured files for intermediate steps
			var stepOut = e.outPath ? _CmdHelper_ReadFile(e.outPath) : '';
			var stepErr = (e.errPath && e.errPath !== e.outPath) ? _CmdHelper_ReadFile(e.errPath) : '';
			var stepCombined = (e.outPath === e.errPath && e.outPath) ? stepOut : (stepOut + stepErr);
			results.push({ cmd: fullCmd, stdout: stepOut, stderr: stepErr, combined: stepCombined, skipped: false, exitCode: 0 });
		}
	}

	return { exitCode: execResult.exitCode, results: results };
}

/**
 * @private
 * Core exec: spawn a shell command, capture stdout/stderr/combined in memory,
 * optionally write to files. Returns {exitCode, stdout, stderr, combined}.
 */
function _CmdHelper_Exec(/**string*/fullCmd, /**string*/outPath, /**string*/errPath)
{
	var ensureDir = function(p) {
		if (!p) return;
		try { _cmdhelper_fs.mkdirSync(_cmdhelper_path.dirname(p), { recursive: true }); } catch(e) {}
	};

	var p = new Promise(function(resolve) {
		var outChunks = [];
		var errChunks = [];
		var combinedChunks = [];

		var child = _cmdhelper_cp.spawn(fullCmd, [], {
			cwd: process.cwd(),
			shell: true,
			detached: false,
			env: process.env,
			stdio: ['ignore', 'pipe', 'pipe']
		});

		child.stdout.on('data', function(chunk) {
			outChunks.push(chunk);
			combinedChunks.push(chunk);
		});

		child.stderr.on('data', function(chunk) {
			errChunks.push(chunk);
			combinedChunks.push(chunk);
		});

		child.on('close', function(code) {
			var stdoutStr = Buffer.concat(outChunks).toString('utf8');
			var stderrStr = Buffer.concat(errChunks).toString('utf8');
			var combinedStr = Buffer.concat(combinedChunks).toString('utf8');
			resolve({ exitCode: code, stdout: stdoutStr, stderr: stderrStr, combined: combinedStr });
		});
		child.on('error', function() {
			resolve({ exitCode: -1, stdout: '', stderr: '', combined: '' });
		});
	});

	var result = global.sync(p, -1);

	// Write to files if paths were provided
	if (outPath) {
		ensureDir(outPath);
		if (outPath === errPath) {
			_cmdhelper_fs.writeFileSync(outPath, result.combined, 'utf8');
		} else {
			_cmdhelper_fs.writeFileSync(outPath, result.stdout, 'utf8');
		}
	}
	if (errPath && errPath !== outPath) {
		ensureDir(errPath);
		_cmdhelper_fs.writeFileSync(errPath, result.stderr, 'utf8');
	}

	return result;
}

/**
 * @private
 * Read a file's content, returning empty string on error.
 */
function _CmdHelper_ReadFile( /**string*/ filePath)
{
	try {
		if(File.Exists(filePath))
		{
			return File.Read(filePath)
		}
	} catch (e) {
	}
	return '';
}

/**
 * @private
 * Remove trailing line from a string (common with command output).
 */
function _CmdHelper_StripLines( /**string*/ source, /**string*/ toRemove)
{
	if (!toRemove) return source;
	var srcLines = ("" + source).split('\n');
	var remLines = ("" + toRemove).split('\n');
	var remSet = {};
	for (var i = 0; i < remLines.length; i++) {
		remSet[remLines[i]] = true;
	}
	var result = [];
	for (var j = 0; j < srcLines.length; j++) {
		if (!remSet[srcLines[j]]) {
			result.push(srcLines[j]);
		}
	}
	return result.join('\n');
}

/**
 * Execute a command or a chain of piped commands.
 *
 * Signatures:
 *   DoCmd(cmd, stdoutFile, stderrFile) - run cmd, write stdout/stderr to user files
 *   DoCmd(cmd)                         - run cmd, collect output internally
 *   DoCmd(cmd, false)                  - run cmd, skip output collection
 *   DoCmd()                            - execute pipe stack only
 *   DoCmd(cmd)                         - execute pipe stack + cmd as final step
 *
 * When only one file path is given as stdoutFile (and stderrFile is undefined),
 * both stdout and stderr go to that single file.
 *
 * @param {string} cmd Command to run (optional if pipe stack has entries)
 * @param {string|boolean} stdoutFile Path for stdout, or false to skip collection
 * @param {string} stderrFile Path for stderr
 * @returns {number} Exit code of the last command
 */
function CmdHelper_DoCmd( /**string*/ cmd, /**string|boolean*/ stdoutFile, /**string*/ stderrFile)
{
	_CmdHelper_Init();
	
	_CmdHelper_ClearPipeStack();
	
	// Build the chain from pipe stack + optional final cmd
	var chain = [];
	for (var i = 0; i < CmdHelper._pipeStack.length; i++) {
		chain.push(CmdHelper._pipeStack[i]);
	}
	if (cmd) {
		chain.push({ cmd: cmd, stdoutFile: stdoutFile, stderrFile: stderrFile });
	}
	if (chain.length === 0) {
		return new SeSDoActionResult(false, "CmdHelper.DoCmd: nothing to execute");
	}

	// Reset results from previous execution
	CmdHelper._results = [];

	var exitCode = 0;

	if (chain.length === 1) {
		// Single command — run directly
		var entry = chain[0];
		var skip = (entry.stdoutFile === false);
		var userOut = (typeof entry.stdoutFile === 'string') ? entry.stdoutFile : null;
		var singleFile = (typeof entry.stdoutFile === 'string' && typeof entry.stderrFile === 'undefined');
		var userErr = (typeof entry.stderrFile === 'string') ? entry.stderrFile : null;

		var outPath = null, errPath = null;
		if (skip) {
			// no capture
		} else if (userOut) {
			outPath = userOut;
			errPath = singleFile ? userOut : (userErr || _CmdHelper_MakeTempPath('_err.txt'));
		} else {
			outPath = _CmdHelper_MakeTempPath('_out.txt');
			errPath = _CmdHelper_MakeTempPath('_err.txt');
		}

		var runResult = _CmdHelper_RunOne(entry.cmd, outPath, errPath, null);
		exitCode = runResult.exitCode;

		CmdHelper._results.push({
			cmd: entry.cmd,
			stdout: skip ? null : runResult.stdout,
			stderr: skip ? null : runResult.stderr,
			combined: skip ? null : runResult.combined,
			skipped: skip,
			exitCode: exitCode
		});
	} else {
		// Multi-step chain — build native pipeline for real line-by-line piping
		var prepared = [];
		for (var idx = 0; idx < chain.length; idx++) {
			var entry = chain[idx];
			var skip = (entry.stdoutFile === false);
			var userOut = (typeof entry.stdoutFile === 'string') ? entry.stdoutFile : null;
			var singleFile = (typeof entry.stdoutFile === 'string' && typeof entry.stderrFile === 'undefined');
			var userErr = (typeof entry.stderrFile === 'string') ? entry.stderrFile : null;

			var outPath = null, errPath = null;
			if (skip) {
				// no capture needed
			} else if (userOut) {
				outPath = userOut;
				errPath = singleFile ? userOut : (userErr || _CmdHelper_MakeTempPath('_err.txt'));
			} else {
				outPath = _CmdHelper_MakeTempPath('_out.txt');
				errPath = _CmdHelper_MakeTempPath('_err.txt');
			}

			prepared.push({ cmd: entry.cmd, outPath: outPath, errPath: errPath, skip: skip });
		}

		var chainResult = _CmdHelper_RunChain(prepared);
		exitCode = chainResult.exitCode;
		CmdHelper._results = chainResult.results;
	}

	// Clear pipe stack (but keep _results and _tempFiles alive for Get* calls)
	CmdHelper._pipeStack = [];

	return new SeSDoActionResult(true, exitCode, "Exit code: "+exitCode);
}

var _paramInfoCmdHelper_DoCmd = {
	_: function ()
	{
		/**
		 * Execute a command or a chain of piped commands. If pipe stack has entries, they are executed first and the given cmd is appended as the final step. Pass `false` as stdoutFile to skip output collection. When only stdoutFile is given (no stderrFile), both streams go to the same file.
		 */
	},
	_type: "number",
	_returns: "Exit code of the last command in the chain.",
	cmd: {
		description: "Command to execute. Optional if pipe stack has entries.",
		defaultValue: ""
	},
	stdoutFile: {
		description: "Path to write stdout to, or `false` to skip output collection.",
		binding: "path",
		ext: "txt",
		optional: true,
		defaultValue: ""
	},
	stderrFile: {
		description: "Path to write stderr to.",
		binding: "path",
		ext: "txt",
		optional: true,
		defaultValue: ""
	}
};

/**
 * Execute a command only when running on Windows. On other platforms this is a no-op returning exit code 0.
 *
 * @param {string} cmd Command to run
 * @param {string|boolean} stdoutFile Path for stdout, or false to skip collection
 * @param {string} stderrFile Path for stderr
 * @returns {number} Exit code of the last command
 */
function CmdHelper_DoCmdWin(/**string*/cmd, /**string|boolean*/stdoutFile, /**string*/stderrFile)
{
	if (process.platform === 'win32') {
		return CmdHelper_DoCmd(cmd, stdoutFile, stderrFile);
	}
	return true;
}

var _paramInfoCmdHelper_DoCmdWin = {
	_: function()
	{
		/**
		 * Execute a command only when running on Windows. On other platforms this is a no-op returning exit code 0.
		 */
	},
	_type: "number",
	_returns: "Exit code of the last command in the chain.",
	cmd: {
		description: "Command to execute."
	},
	stdoutFile: {
		description: "Path to write stdout to, or `false` to skip output collection.",
		binding: "path",
		ext: "txt",
		optional: true,
		defaultValue: ""
	},
	stderrFile: {
		description: "Path to write stderr to.",
		binding: "path",
		ext: "txt",
		optional: true,
		defaultValue: ""
	}
};

/**
 * Execute a command only when running on Linux or macOS. On Windows this is a no-op returning exit code 0.
 *
 * @param {string} cmd Command to run
 * @param {string|boolean} stdoutFile Path for stdout, or false to skip collection
 * @param {string} stderrFile Path for stderr
 * @returns {number} Exit code of the last command
 */
function CmdHelper_DoCmdLin(/**string*/cmd, /**string|boolean*/stdoutFile, /**string*/stderrFile)
{
	if (process.platform === 'linux' || process.platform === 'darwin') {
		return CmdHelper_DoCmd(cmd, stdoutFile, stderrFile);
	}
	return true;
}

var _paramInfoCmdHelper_DoCmdLin = {
	_: function()
	{
		/**
		 * Execute a command only when running on Linux or macOS. On Windows this is a no-op returning exit code 0.
		 */
	},
	_type: "number",
	_returns: "Exit code of the last command in the chain.",
	cmd: {
		description: "Command to execute."
	},
	stdoutFile: {
		description: "Path to write stdout to, or `false` to skip output collection.",
		binding: "path",
		ext: "txt",
		optional: true,
		defaultValue: ""
	},
	stderrFile: {
		description: "Path to write stderr to.",
		binding: "path",
		ext: "txt",
		optional: true,
		defaultValue: ""
	}
};

/**
 * Run a Windows desktop shortcut (.lnk) by name or full path. Windows only.
 * If a plain name is given (no path separators, no .lnk extension),
 * it is resolved from the user's Desktop or the Public Desktop folder.
 *
 * @param {string} desktopShortcutNameOrShortcutPath Shortcut name (e.g. "MyApp") or full path to a .lnk file
 * @returns {number} Exit code or PID depending on the shortcut target
 */
function CmdHelper_DoRunShortcut(/**string*/desktopShortcutNameOrShortcutPath)
{
	_CmdHelper_Init();

	if (process.platform !== 'win32') {
		return new SeSDoActionResult(false, 0, "CmdHelper.DoRunShortcut: This function is Windows only");
	}

	var shortcutPath = desktopShortcutNameOrShortcutPath;

	// If it looks like a bare name (no separators, no .lnk), resolve from Desktop
	if (shortcutPath.indexOf('/') < 0 && shortcutPath.indexOf('\\') < 0) {
		if (!/\.lnk$/i.test(shortcutPath)) {
			shortcutPath = shortcutPath + '.lnk';
		}

		// Resolve actual Desktop folder via shell (handles OneDrive, redirected folders, etc.)
		var userDesktop = '';
		try {
			userDesktop = _cmdhelper_cp.execSync(
				'powershell -NoProfile -Command "[Environment]::GetFolderPath(\'Desktop\')"',
				{ encoding: 'utf8' }
			).trim();
		} catch(e) {}
		if (!userDesktop) {
			userDesktop = _cmdhelper_path.join(process.env.USERPROFILE || '', 'Desktop');
		}

		var publicDesktop = '';
		try {
			publicDesktop = _cmdhelper_cp.execSync(
				'powershell -NoProfile -Command "[Environment]::GetFolderPath(\'CommonDesktopDirectory\')"',
				{ encoding: 'utf8' }
			).trim();
		} catch(e) {}
		if (!publicDesktop) {
			publicDesktop = _cmdhelper_path.join(process.env.PUBLIC || 'C:\\Users\\Public', 'Desktop');
		}

		var candidates = [
			_cmdhelper_path.join(userDesktop, shortcutPath),
			_cmdhelper_path.join(publicDesktop, shortcutPath)
		];

		var resolved = false;
		for (var ci = 0; ci < candidates.length; ci++) {
			if (_cmdhelper_fs.existsSync(candidates[ci])) {
				shortcutPath = candidates[ci];
				resolved = true;
				break;
			}
		}
		if (!resolved) {
			shortcutPath = candidates[0];
		}
	}

	if (!_cmdhelper_fs.existsSync(shortcutPath)) {
		return new SeSDoActionResult(false, 0, 'CmdHelper.DoRunShortcut: ' + desktopShortcutNameOrShortcutPath, 'Shortcut not found: ' + shortcutPath);
	}

	var cmd = 'start "" "' + shortcutPath.replace(/\//g, '\\') + '"';
	var result = _CmdHelper_Exec(cmd, null, null);
	CmdHelper._results = [{
		cmd: cmd,
		stdout: result.stdout,
		stderr: result.stderr,
		combined: result.combined,
		skipped: false,
		exitCode: result.exitCode
	}];
	return new SeSDoActionResult(true, result.exitCode, 'CmdHelper.DoRunShortcut: ' + desktopShortcutNameOrShortcutPath, '' + shortcutPath);
}

var _paramInfoCmdHelper_DoRunShortcut = {
	_: function()
	{
		/**
		 * Run a Windows desktop shortcut (.lnk) by name or full path. Windows only. If a plain name is given, it is resolved from the user's Desktop or the Public Desktop folder.
		 */
	},
	_type: "number",
	_returns: "Exit code of the launched shortcut.",
	desktopShortcutNameOrShortcutPath: {
		description: "Shortcut name (e.g. 'MyApp') or full path to a .lnk file.",
		binding: "path",
		ext: "lnk"
	}
};

/**
 * Launch a Windows Store (UWP/MSIX) app by package family name or by matching a name/substring.
 * Windows only. Uses the COM IApplicationActivationManager API to launch the app and capture its PID.
 * If the name contains '!' or '_' it is treated as a package family name and launched directly.
 * Otherwise, installed packages are searched for a match and the first hit is launched.
 *
 * @param {string} name Package family name (e.g. "Microsoft.WindowsCalculator_8wekyb3d8bbwe!App") or a display name / substring to match (e.g. "Calculator")
 * @returns {number} PID of the launched app, or -1 on failure
 */
function CmdHelper_DoRunStoreApp(/**string*/name)
{
	_CmdHelper_Init();

	if (process.platform !== 'win32') {
		return new SeSDoActionResult(false, 0, 'CmdHelper.DoRunStoreApp: This function is Windows only');
	}

	var appId = null;

	if (name.indexOf('!') >= 0) {
		// Already a full app ID like "PackageFamilyName!AppId"
		appId = name;
	} else if (name.indexOf('_') >= 0 && name.indexOf(' ') < 0) {
		// Looks like a package family name without the !App suffix
		appId = name + '!App';
	} else {
		// Search installed packages by display name
		var safeName = name.replace(/'/g, "''");
		var resolveScript = "$pkg = Get-AppxPackage | Where-Object { $_.Name -like '*" + safeName + "*' }; "
			+ "if ($pkg) { "
			+ "  $manifest = Get-AppxPackageManifest $pkg[0]; "
			+ "  $appid = $manifest.Package.Applications.Application.Id; "
			+ "  if ($appid -is [array]) { $appid = $appid[0] }; "
			+ "  Write-Output ($pkg[0].PackageFamilyName + '!' + $appid) "
			+ "} else { Write-Output '' }";
		try {
			appId = _cmdhelper_cp.execSync(
				'powershell -NoProfile -Command "& { ' + resolveScript + ' }"',
				{ encoding: 'utf8' }
			).trim();
		} catch(e) {
			appId = '';
		}

		if (!appId) {
			return new SeSDoActionResult(false, 0, 'CmdHelper.DoRunStoreApp: ' + name, 'No installed Store app matching: ' + name);
		}
	}

	// Launch via Shell.Application, then find PID from the package's executable
	var pid = -1;
	var launchErr = '';
	try {
		var shell = new ActiveXObject('Shell.Application');
		shell.ShellExecute('explorer.exe', 'shell:AppsFolder\\' + appId);

		// Extract package family name (everything before '!')
		var pkgFamily = appId.indexOf('!') >= 0 ? appId.substring(0, appId.indexOf('!')) : appId;
		var safePkg = pkgFamily.replace(/'/g, "''");

		// Poll for the app process to appear (up to 5 seconds)
		var psFind = ""
			+ "$pkg = Get-AppxPackage | Where-Object { $_.PackageFamilyName -eq '" + safePkg + "' }; "
			+ "if ($pkg) { "
			+ "  $installDir = $pkg.InstallLocation; "
			+ "  $manifest = [xml](Get-Content (Join-Path $installDir 'AppxManifest.xml')); "
			+ "  $exe = $manifest.Package.Applications.Application.Executable; "
			+ "  if ($exe -is [array]) { $exe = $exe[0] }; "
			+ "  $exeName = [System.IO.Path]::GetFileNameWithoutExtension($exe); "
			+ "  $proc = Get-Process -Name $exeName -ErrorAction SilentlyContinue | Select-Object -First 1; "
			+ "  if ($proc) { Write-Output $proc.Id } else { Write-Output '0' } "
			+ "} else { Write-Output '0' }";

		var attempts = 10;
		for (var attempt = 0; attempt < attempts; attempt++) {
			Global.DoSleep(500);
			try {
				var pidStr = _cmdhelper_cp.execSync(
					'powershell -NoProfile -Command "& { ' + psFind + ' }"',
					{ encoding: 'utf8' }
				).trim();
				pid = parseInt(pidStr, 10);
				if (pid > 0) break;
			} catch(e2) {}
		}

		if (pid <= 0) {
			launchErr = 'App launched but could not determine PID';
		}
	} catch(e) {
		launchErr = '' + (e.message || e);
	}

	if (pid <= 0) {
		return new SeSDoActionResult(false, -1, 'CmdHelper.DoRunStoreApp: ' + name, 'Failed to launch: ' + appId + '. ' + launchErr);
	}

	return new SeSDoActionResult(true, pid, 'CmdHelper.DoRunStoreApp: ' + name, 'PID: ' + pid + ', AppId: ' + appId);
}

var _paramInfoCmdHelper_DoRunStoreApp = {
	_: function()
	{
		/**
		 * Launch a Windows Store (UWP/MSIX) app. Windows only. Accepts a full package family name or a display name / substring to search for among installed apps.
		 */
	},
	_type: "number",
	_returns: "PID of the launched app, or -1 on failure.",
	name: {
		description: "Package family name (e.g. 'Microsoft.WindowsCalculator_8wekyb3d8bbwe!App') or a display name / substring to match (e.g. 'Calculator')."
	}
};

/**
 * Add a command to the pipe stack. Commands in the stack are chained
 * together when DoCmd is called: stdout of each feeds stdin of the next.
 *
 * @param {string} cmd Command to add
 * @param {string|boolean} stdoutFile Path for stdout, or false to skip collection for this step
 * @param {string} stderrFile Path for stderr
 */
function CmdHelper_Pipe( /**string*/ cmd, /**string|boolean*/ stdoutFile, /**string*/ stderrFile)
{
	_CmdHelper_Init();
	CmdHelper._pipeStack.push({
		cmd: cmd,
		stdoutFile: stdoutFile,
		stderrFile: stderrFile
	});
}

var _paramInfoCmdHelper_Pipe = {
	_: function ()
	{
		/**
		 * Add a command to the pipe stack. Commands are chained together when DoCmd is called: stdout of each feeds stdin of the next.
		 */
	},
	cmd: {
		description: "Command to add to the pipe chain."
	},
	stdoutFile: {
		description: "Path to write stdout to, or `false` to skip collection for this step.",
		binding: "path",
		ext: "txt",
		optional: true,
		defaultValue: ""
	},
	stderrFile: {
		description: "Path to write stderr to.",
		binding: "path",
		ext: "txt",
		optional: true,
		defaultValue: ""
	}
};

/**
 * Add a command to the pipe stack only when running on Windows. On other platforms this is a no-op.
 *
 * @param {string} cmd Command to add
 * @param {string|boolean} stdoutFile Path for stdout, or false to skip collection for this step
 * @param {string} stderrFile Path for stderr
 */
function CmdHelper_PipeWin(/**string*/cmd, /**string|boolean*/stdoutFile, /**string*/stderrFile)
{
	if (process.platform === 'win32') {
		CmdHelper_Pipe(cmd, stdoutFile, stderrFile);
		return true;
	}
	return false;
}

var _paramInfoCmdHelper_PipeWin = {
	_: function()
	{
		/**
		 * Add a command to the pipe stack only when running on Windows. On other platforms this is a no-op.
		 */
	},
	cmd: {
		description: "Command to add to the pipe chain."
	},
	stdoutFile: {
		description: "Path to write stdout to, or `false` to skip collection for this step.",
		binding: "path",
		ext: "txt",
		optional: true,
		defaultValue: ""
	},
	stderrFile: {
		description: "Path to write stderr to.",
		binding: "path",
		ext: "txt",
		optional: true,
		defaultValue: ""
	}
};

/**
 * Add a command to the pipe stack only when running on Linux or macOS. On Windows this is a no-op.
 *
 * @param {string} cmd Command to add
 * @param {string|boolean} stdoutFile Path for stdout, or false to skip collection for this step
 * @param {string} stderrFile Path for stderr
 */
function CmdHelper_PipeLin(/**string*/cmd, /**string|boolean*/stdoutFile, /**string*/stderrFile)
{
	if (process.platform === 'linux' || process.platform === 'darwin') {
		CmdHelper_Pipe(cmd, stdoutFile, stderrFile);
		return true;
	}
	return false;
}

var _paramInfoCmdHelper_PipeLin = {
	_: function()
	{
		/**
		 * Add a command to the pipe stack only when running on Linux or macOS. On Windows this is a no-op.
		 */
	},
	cmd: {
		description: "Command to add to the pipe chain."
	},
	stdoutFile: {
		description: "Path to write stdout to, or `false` to skip collection for this step.",
		binding: "path",
		ext: "txt",
		optional: true,
		defaultValue: ""
	},
	stderrFile: {
		description: "Path to write stderr to.",
		binding: "path",
		ext: "txt",
		optional: true,
		defaultValue: ""
	}
};

/**
 * Get stdout from the last executed command, or from a specific step by index.
 * @param {number} index Optional 0-based index into the chain results
 * @returns {string} Stdout text
 */
function CmdHelper_GetStdOut( /**number*/ index)
{
	_CmdHelper_Init();
	if (typeof index === 'number' && index >= 0 && index < CmdHelper._results.length) {
		return CmdHelper._results[index].stdout || '';
	}
	// Default: last result
	var last = CmdHelper._results[CmdHelper._results.length - 1];
	return last ? (last.stdout || '') : '';
}

var _paramInfoCmdHelper_GetStdOut = {
	_: function ()
	{
		/**
		 * Get stdout from the last executed command, or from a specific step by 0-based index.
		 */
	},
	_type: "string",
	_returns: "Stdout text.",
	index: {
		description: "0-based index into the chain results. If omitted, returns stdout from the last command.",
		optional: true
	}
};

/**
 * Get stderr from the last executed command, or from a specific step by index.
 * @param {number} index Optional 0-based index into the chain results
 * @returns {string} Stderr text
 */
function CmdHelper_GetStdErr( /**number*/ index)
{
	_CmdHelper_Init();
	if (typeof index === 'number' && index >= 0 && index < CmdHelper._results.length) {
		return CmdHelper._results[index].stderr || '';
	}
	var last = CmdHelper._results[CmdHelper._results.length - 1];
	return last ? (last.stderr || '') : '';
}

var _paramInfoCmdHelper_GetStdErr = {
	_: function ()
	{
		/**
		 * Get stderr from the last executed command, or from a specific step by 0-based index.
		 */
	},
	_type: "string",
	_returns: "Stderr text.",
	index: {
		description: "0-based index into the chain results. If omitted, returns stderr from the last command.",
		optional: true
	}
};

/**
 * Get interleaved stdout+stderr from the last executed command, or from a specific step.
 * The output is mixed in the order produced by the console (stderr interleaved with stdout).
 * @param {number} index Optional 0-based index into the chain results
 * @returns {string} Combined output text
 */
function CmdHelper_GetStdOutAndErr( /**number*/ index)
{
	_CmdHelper_Init();
	var result;
	if (typeof index === 'number' && index >= 0 && index < CmdHelper._results.length) {
		result = CmdHelper._results[index];
	} else {
		result = CmdHelper._results[CmdHelper._results.length - 1];
	}
	if (!result) return '';
	// If we have a combined capture (from 2>&1 re-run), use it
	if (result.combined) return result.combined;
	// Fallback: concatenate stdout + stderr
	return (result.stdout || '') + (result.stderr || '');
}

var _paramInfoCmdHelper_GetStdOutAndErr = {
	_: function ()
	{
		/**
		 * Get interleaved stdout+stderr from the last executed command, or from a specific step. The output is mixed in the order produced by the console.
		 */
	},
	_type: "string",
	_returns: "Combined stdout and stderr text.",
	index: {
		description: "0-based index into the chain results. If omitted, returns combined output from the last command.",
		optional: true
	}
};

/**
 * Get number of lines in the string.
 * @param {string} strData Input data
 * @returns {number} Number of lines
 */
function CmdHelper_GetLinesCount( /**string*/ strData)
{
	_CmdHelper_Init();
	if( typeof strData == 'undefined' )
	{
		strData = CmdHelper.GetStdOutAndErr();
	}
	return ("" + strData).trimEnd('\r\n').split('\n').length;
}

var _paramInfoCmdHelper_GetLinesCount = {
	_: function ()
	{
		/**
		 * Get number of lines in the string.
		 */
	},
	_type: "number",
	_returns: "Number of lines.",
	strData: {
		description: "Input data string. When not set, get stderr and stdout from last CmdHelper.DoCmd",
		defaultValue: null,
		optional: true
	}
};

/**
 * Verify that the last command exited with code 0 and produced no stderr output.
 * @param {string} message Assertion message
 */
function CmdHelper_VerifySuccess(/**string*/message)
{
	_CmdHelper_Init();
	var last = CmdHelper._results[CmdHelper._results.length - 1];
	var code = last ? last.exitCode : -1;
	var err = last ? (last.stderr || '') : '';
	if (!message) {
		message = last ? last.cmd : 'CmdHelper.VerifySuccess';
	}
	var stdout = last ? (last.stdout || '') : '';
	var pass = (code === 0) && (err.trim() === '');
	var details = "Exit code: " + code;
	Tester.Assert(message, pass, ["stdout: " + stdout.substring(0, 200), "stderr: " + err.substring(0, 200)], {comment:details});
}

var _paramInfoCmdHelper_VerifySuccess = {
	_: function()
	{
		/**
		 * Verify that the last command exited with code 0 and produced no stderr output.
		 */
	},
	message: {
		description: "Assertion message. If empty, the last executed command line is used.",
		optional: true,
		defaultValue: ""
	}
};

var _paramInfoCmdHelper_VerifyEmpty = {
	_: function ()
	{
		/**
		 * Verify that the given string data is empty.
		 */
	},
	message: {
		description: "Assertion message."
	},
	strData: {
		description: "Data to check. When not set, get stderr and stdout from last CmdHelper.DoCmd",
		defaultValue: null,
		optional: true
	}
};
