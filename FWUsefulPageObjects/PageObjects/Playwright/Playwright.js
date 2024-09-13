
/**
 * @PageObject Playwright.DoInvoke(async callBack({page,expect})=>{...}). Allow playwright to attach to currently running browser (with Navigator.Open) and do something using Playwright.
 */
SeSPageObject("Playwright");

function _PlaywrightInit()
{
	// Restore packages if needed
	if (!File.FolderExists(g_workDir+'\\node_modules'))
	{
		const npmCmd = g_helper.ResolvePath("InstrumentJS/npm.cmd");
		Global.DoCmd('"' + npmCmd + '"' + " install playwright @playwright/test", g_workDir, true, true);
	}
}

function _PlaywrightSyncRun(f) {
	const deasync = require("deasync");
	let asyncResult = undefined;
	let asyncDone = false;
	async function impl() {
		try
		{
			asyncResult = await f();
		} catch(e) {
			const data=[e.stack];
			const pos = _extractFirstEntryAfterCallLog(e.stack);
			if(pos) {
				data.push(
					new SeSReportLink(pos.filePath+"("+pos.lineNumber+","+pos.columnNumber+")")
				);
			}
			Tester.SoftAssert(e.message, false, data);
			
			asyncResult = false;
		} finally {
			asyncDone = true;
		}
	}
	impl();
	while(!asyncDone) {
		deasync.runLoopOnce();
	}
	return asyncResult;
}

async function getPlaywrightBrowser()
{
	const playwright = require('playwright');
	const cdpUrl = "http://"+WebDriver.d.GetDebuggerAddress();
	const browser = await playwright.chromium.connectOverCDP(cdpUrl, {
    logger: {
      isEnabled: (name, severity) => true,
      log: (name, severity, message, args) => console.log(`${name} ${message}`)
    }
	});
	return {playwright, browser};
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

/**
 * Run playwright test `cmdParams` and import results into Rapise test report.
 * 
 * @param {String} `cmdParams` additional parameters. The params is anything mentioned here: https://playwright.dev/docs/test-cli going after `npx playwright test `
 *
 * Examples:
 *   // Run all test *.spec.js / *.spec.ts files (with respect to playwright.config.ts / playwright.config.js)
 *   Playwright.DoPlay();
 *   // Run files that have my-spec or my-spec-2 in the file name
 *   Playwright.DoPlay("my-spec my-spec-2");
 *   // Run tests that are in line 42 in my-spec.ts
 *   Playwright.DoPlay("my-spec.ts:42");
 *   // Run tests in headed browsers
 *   Playwright.DoPlay("--headed");
 */
function Playwright_DoPlay(/**string*/cmdParams)
{
	_PlaywrightInit();
	cmdParams = cmdParams || "";
	const resPath = "playwright-report.json";
	g_helper.SetEnv("PLAYWRIGHT_JSON_OUTPUT_FILE", resPath);
	Global.DoCmd('node_modules\\.bin\\playwright.cmd test --reporter=json '+cmdParams, g_workDir, true, true);
	Playwright_DoImportJsonReport(resPath);
	return true;
}

async function _DoInvokeForCurrentBrowser(cb)
{
	const {playwright, browser} = await getPlaywrightBrowser();
	try
	{
		const {expect} = require("@playwright/test");
		const defaultContext = browser.contexts()[0];
		const page = defaultContext.pages()[0];
		
		const res = await cb({page, expect, browser});
		if(typeof res == 'undefined') return true;
		
		return res;
	} finally {
		await browser.close();
	}
}

/**
 * Invoke user callback, passing current browser as a parameter: cb({page,expect,browser})
 * @param {function} `callBack` your callback function fn(page,expect,browser) to invoke.
 *
 * Examples:
 *   Playwright.DoInvoke(async ({page,expect}) {
       await expect(page).not.toHaveURL('error');
     })
 * 
 */
function Playwright_DoInvoke(/**function*/callBack)
{
	_PlaywrightInit();
	const res = _PlaywrightSyncRun(()=>_DoInvokeForCurrentBrowser(callBack));
	return res;
}

/**
 * Import report in JSON format produced by Playwright earlier.
 */
function Playwright_DoImportJsonReport(/**string*/path)
{
	path = path || "test-results.json";
	const j = JSON.parse(File.Read(path));
	
	function stripAnsi(ansiString) {
		// Regular expression to match ANSI escape codes
		// Replace the ANSI codes with an empty string
		ansiString = ansiString
			.replace(/\u001b\[[0-9;]*m/g, '')
			.replace(/\>/g, '&gt;')
			.replace(/ /g, '&nbsp;')
			.replace(/\n/g, '<br/>');
		return "<tt>"+ansiString+"</tt>";
	}
	
	function allTests(o,path) {
		path = path||"";
		if(o.suites) {
			SeSEachKey(o.suites, function(k,suite) {
				path += " - " + suite.title;
				allTests(suite, path);
			});
		} else if(o.specs) {
			SeSEachKey(o.specs, function(k,spec) {
				path += " - " + spec.title;
				allTests(spec, path);
			});
		} else if(o.tests) {
			const isOk = o.ok;
			let data = [];
			SeSEachKey(o.tests, function(k,test) {
				SeSEachKey(test.results, function(k,result) {
					if(result.error) {
						data.push(stripAnsi(result.error.message));
						if( result.error.snippet ) {
							data.push(stripAnsi(result.error.snippet));
						}
						if( result.error.location ) {
							data.push(new SeSReportLink(result.error.location.file+"("+result.error.location.line+","+result.error.location.column+")"));
						}
					}
					data.push("Duration: "+result.duration);
				});
			});
			
			Tester.SoftAssert(path, isOk, data);
		}
	}

	allTests(j, "");
	return true;
}
