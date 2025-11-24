
/**
 * @PageObject Playwright.DoInvoke(async callBack({page,expect})=>{...}). Allow playwright to attach to currently running browser (with Navigator.Open) and do something using Playwright.
 * @Version 0.0.5
 */
SeSPageObject("Playwright");

function _PlaywrightInit()
{
	try {
		const playwright = require('playwright');
	} catch(e) {
		Log("Playwright not installed, doing npm install");
		var npmCmd = g_helper.ResolvePath("InstrumentJS/npm.cmd") || 'npm';
		Global.DoCmd('"' + npmCmd + '"' + " install playwright @playwright/test --prefix \"" + g_workDir + "\"", g_workDir, true, false);
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
	if (!WebDriver.d)
	{
		WebDriver.ReconnectSession();
	}
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


/**
 * Use query to find an element by plain text description. The more detailed description
 * the better.
 * @param {string} `query` text AI query.
 */
function Playwright_GetElementByAi(/**string*/query)/**HTMLObject|false*/
{
	function getFullXPathByRef(ref)
	{
		var xpath = Playwright.DoInvoke(async ({page,expect})=>{
			await page._snapshotForAI();
			// Now find an element by ref
			const foundEl = await page.locator(`aria-ref=${ref}`);
			const xpathChain = await getXPathChain(page, foundEl);
			return xpathChain.join('@@@');
		})
		return xpath;
	}
	
	/**
	 * Build an array of XPaths from the page root to the given element.
	 * - If the element is in the main frame: returns [ <element xpath or shadow-aware Rapise locator> ]
	 * - If inside frames: [ <rootmost frame xpath>, ..., <innermost frame xpath>, <element xpath or shadow-aware Rapise locator> ]
	 * Supports Rapise Shadow DOM extension using `@#@` where:
	 *   <light-dom host xpath>@#@css=<selector within shadow root>[@#@css=<nested selector>...]
	 *
	 * Notes:
	 * - Supports nested Shadow DOMs (multiple @#@ segments).
	 * - In HTML XPath parts, omits `[1]` when the element is unique among siblings with the same tag.
	 *
	 * @param {import('@playwright/test').Page} page
	 * @param {import('@playwright/test').Locator|import('@playwright/test').ElementHandle} element
	 * @returns {Promise<string[]>}
	 */
	async function getXPathChain(page, element) {
		const elHandle = (typeof element.elementHandle === 'function')
			? await element.elementHandle()
			: element;
		if (!elHandle) throw new Error('Element not found / detached');

		const chain = [];

		// Helper: absolute XPath of an element within its current document (Light DOM),
		// omitting [1] when the element is unique among same-name siblings.
		async function absXPath(elemHandle) {
			return await elemHandle.evaluate((node) => {
				// Ensure we’re on an element
				if (node && node.nodeType !== Node.ELEMENT_NODE) node = node.parentElement;
				if (!node) return null;

				function sameNameSiblingsInfo(n) {
					let idx = 1;
					let hasSameBefore = false;
					let hasSameAfter = false;

					let s = n.previousSibling;
					while (s) {
						if (s.nodeType === 1 && s.nodeName === n.nodeName) {
							hasSameBefore = true;
							idx++;
						}
						s = s.previousSibling;
					}
					s = n.nextSibling;
					while (s) {
						if (s.nodeType === 1 && s.nodeName === n.nodeName) {
							hasSameAfter = true;
							break;
						}
						s = s.nextSibling;
					}
					return { idx, unique: (!hasSameBefore && !hasSameAfter) };
				}

				const parts = [];
				let cur = node;
				const docEl = node.ownerDocument && node.ownerDocument.documentElement;

				while (cur && cur.nodeType === 1 && cur !== docEl) {
					const name = cur.nodeName.toLowerCase();
					const { idx, unique } = sameNameSiblingsInfo(cur);
					parts.unshift(unique ? `${name}` : `${name}[${idx}]`);
					cur = cur.parentElement;
				}

				if (docEl) {
					// include root element (usually html or svg); omit [1]
					const rootName = docEl.nodeName.toLowerCase();
					parts.unshift(`${rootName}`);
				}

				return '/' + parts.join('/');
			});
		}

		// Helper: build a CSS path from the current shadow root to the given node,
		// omitting :nth-of-type(1) when unique among same-tag siblings.
		async function cssPathWithinShadow(elemHandle) {
			return await elemHandle.evaluate((node) => {
				const root = node && node.getRootNode && node.getRootNode();
				if (!(root && root instanceof ShadowRoot)) return null;

				function selectorFor(el) {
					const tag = el.localName || el.tagName.toLowerCase();
					let idx = 1;
					let sameBefore = false;
					let sameAfter = false;

					let sib = el.previousElementSibling;
					while (sib) {
						if (sib.localName === tag) {
							sameBefore = true;
							idx++;
						}
						sib = sib.previousElementSibling;
					}
					sib = el.nextElementSibling;
					while (sib) {
						if (sib.localName === tag) {
							sameAfter = true;
							break;
						}
						sib = sib.nextElementSibling;
					}

					// If unique, omit :nth-of-type(1)
					if (!sameBefore && !sameAfter) return `${tag}`;
					return `${tag}:nth-of-type(${idx})`;
				}

				const parts = [];
				let cur = node;

				// climb within this shadow root up to its direct children boundary
				while (cur && cur instanceof Element) {
					parts.unshift(selectorFor(cur));
					const parent = cur.parentElement;
					if (!parent || parent.getRootNode() !== root) break;
					cur = parent;
				}

				return 'css=' + parts.join(' > ');
			});
		}

		// Walk up through frames: from the element's owner frame to the top
		let frame = await elHandle.ownerFrame();
		while (frame) {
			const parent = frame.parentFrame();
			if (!parent) break; // main frame reached
			const iframeEl = await frame.frameElement(); // <iframe> element inside parent document
			const iframeXPath = await absXPath(iframeEl);
			chain.push(iframeXPath);
			frame = parent;
		}

		// We collected from inner->outer; reverse to get rootmost first
		chain.reverse();

		// Build the element locator for the innermost document, supporting nested Shadow DOM:
		// If inside shadow DOM(s): <outermost-host-xpath>@#@css=<outermost path>@#@css=<next inner path>...@#@css=<innermost path to element>
		// Else: absolute XPath to the element.
		const shadowCssSegments = [];

		let curHandle = elHandle;

		// Collect nested shadow segments (inner -> outer):
		// For the current node, if it is inside a shadow root, record its CSS path within that root,
		// then jump to the shadow host (Light DOM element) and repeat while that host itself is inside another shadow root.
		while (true) {
			const seg = await cssPathWithinShadow(curHandle);
			if (!seg) break;
			shadowCssSegments.push(seg);

			// Move to the shadow host in Light DOM
			const hostHandle = await curHandle.evaluateHandle((node) => {
				const r = node && node.getRootNode && node.getRootNode();
				return (r && r instanceof ShadowRoot) ? r.host : null;
			});
			const hostEl = hostHandle.asElement();
			if (!hostEl) break;
			curHandle = hostEl;
			// Continue; if host is inside another shadow root, next loop will capture its path within that outer root
		}

		let elementLocator;
		if (shadowCssSegments.length > 0) {
			// curHandle is now the outermost shadow host (in Light DOM)
			const hostXPath = await absXPath(curHandle);
			// reverse so the order is outermost -> innermost for Rapise
			elementLocator = hostXPath + '@#@' + shadowCssSegments.reverse().join('@#@');
		} else {
			// No shadow: absolute XPath to the element itself (with [1] omitted where unique)
			elementLocator = await absXPath(elHandle);
		}

		chain.push(elementLocator);

		return chain;
	}


	/**
	 * Parse JSON-ish output from an LLM.
	 * Handles: ```json fences, extra prose, comments, trailing commas, single quotes,
	 * smart quotes/backticks, HTML entities, BOM, and balanced block extraction.
	 *
	 * @param {string} raw
	 * @param {{unsafeEvalFallback?: boolean, json5Parser?: { parse: (s:string)=>any }}} [opts]
	 *	 - unsafeEvalFallback: as a *last resort*, try parsing as a JS literal via Function(...) (unsafe).
	 *	 - json5Parser: pass JSON5 (if available) for a safer extended-JSON fallback.
	 */
	function parseLLMJson(raw, opts = {}) {
		const attempts = [];
		const pushAttempt = (label, str) => attempts.push({ label, str });
	
		// 1) Basic normalizations
		let s = (raw ?? '').toString();
		s = s.replace(/^\uFEFF/, '');								 // strip BOM
		s = s.trim();
	
		// 2) Pull out fenced code blocks if present (prefer json-like blocks)
		const fenceBlocks = [];
		const fenceRe = /```(?:jsonc|json|javascript|js|ts|typescript|txt)?\s*\n([\s\S]*?)```/gi;
		let m;
		while ((m = fenceRe.exec(s))) fenceBlocks.push(m[1]);
		if (fenceBlocks.length) {
			// Pick the most "JSON-looking" block (naive score: braces + brackets + length)
			const scored = fenceBlocks
				.map(b => ({ b, score: (b.match(/[{}\[\]]/g) || []).length + b.length * 0.001 }))
				.sort((a, b) => b.score - a.score);
			s = scored[0].b.trim();
		}
	
		// Some models prepend "json" on the first line even without fences
		s = s.replace(/^\s*json\s*\n/i, '');
	
		// 3) Decode common HTML entities and normalize quotes/backticks
		s = decodeEntities(s);
		s = normalizeQuotes(s);
	
		// 4) If there’s extra prose, extract the first balanced JSON-ish block
		const extracted = extractBalancedJson(s);
		if (extracted) s = extracted.trim();
	
		// 5) Remove JS/JSONC comments and trailing commas
		s = stripComments(s);
		s = stripTrailingCommas(s);
	
		// 6) Fix single-quoted keys/strings and bareword keys
		s = fixSingleQuotedKeysAndValues(s);
		s = fixBarewordKeys(s);
	
		// 7) Final tidy and parse attempts
		s = stripTrailingCommas(s); // again, after quote fixes
		pushAttempt('cleaned', s);
	
		// If still not valid, try a few graceful variants
		pushAttempt('no newlines', s.replace(/\r?\n/g, ' '));
		pushAttempt('trim outer junk', trimOuterNonJson(s));
	
		// Optional JSON5 fallback (if caller provided)
		if (opts.json5Parser) {
			for (const a of attempts) {
				try { return opts.json5Parser.parse(a.str); } catch {}
			}
		}
	
		// Standard JSON.parse attempts
		for (const a of attempts) {
			try { return JSON.parse(a.str); } catch {}
		}
	
		// Optional unsafe fallback: interpret as JS literal (NOT for untrusted input)
		if (opts.unsafeEvalFallback) {
			for (const a of attempts) {
				try { return new Function(`return (${a.str})`)(); } catch {}
			}
		}
	
		// If all failed, throw with helpful context
		const lastErr = tryJsonParse(s);
		const preview = s.slice(0, 400);
		throw new Error(
			`Failed to parse LLM JSON after ${attempts.length} attempts. Last error: ${lastErr?.message || 'n/a'}\n` +
			`Preview:\n${preview}${s.length > preview.length ? '…' : ''}`
		);
	
		// ---- helpers ----
	
		function tryJsonParse(str) {
			try { JSON.parse(str); return null; } catch (e) { return e; }
		}
	
		function decodeEntities(str) {
			return str
				.replace(/&quot;/g, '"')
				.replace(/&apos;/g, "'")
				.replace(/&amp;/g, '&')
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>');
		}
	
		function normalizeQuotes(str) {
			// smart double quotes → "
			str = str.replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"');
			// smart single quotes → '
			str = str.replace(/[\u2018\u2019\u201B\u2032]/g, "'");
			// occasional stray backticks → "
			str = str.replace(/`/g, '"');
			return str;
		}
	
		function extractBalancedJson(text) {
			// Find first { or [ and return the shortest balanced block.
			let start = text.search(/[{\[]/);
			if (start < 0) return null;
	
			for (let i = start; i < text.length; i++) {
				const ch = text[i];
				if (ch !== '{' && ch !== '[') continue;
				const open = ch;
				const close = ch === '{' ? '}' : ']';
				let depth = 0, inStr = false, quote = null, esc = false;
	
				for (let j = i; j < text.length; j++) {
					const c = text[j];
					if (inStr) {
						if (esc) { esc = false; }
						else if (c === '\\') { esc = true; }
						else if (c === quote) { inStr = false; quote = null; }
					} else {
						if (c === '"' || c === "'") { inStr = true; quote = c; }
						else if (c === open) { depth++; }
						else if (c === close) {
							depth--;
							if (depth === 0) return text.slice(i, j + 1);
						}
					}
				}
			}
			return null;
		}
	
		function stripComments(text) {
			let out = '';
			let i = 0, inStr = false, quote = null, esc = false, inLine = false, inBlock = false;
	
			while (i < text.length) {
				const c = text[i], n = text[i + 1];
	
				if (inLine) {
					if (c === '\n') { inLine = false; out += c; }
					i++; continue;
				}
				if (inBlock) {
					if (c === '*' && n === '/') { inBlock = false; i += 2; }
					else { i++; }
					continue;
				}
				if (inStr) {
					out += c;
					if (esc) { esc = false; }
					else if (c === '\\') { esc = true; }
					else if (c === quote) { inStr = false; quote = null; }
					i++; continue;
				}
	
				// not in string/comment
				if (c === '/' && n === '/') { inLine = true; i += 2; continue; }
				if (c === '/' && n === '*') { inBlock = true; i += 2; continue; }
				if (c === '"' || c === "'") { inStr = true; quote = c; out += c; i++; continue; }
	
				out += c; i++;
			}
			return out;
		}
	
		function stripTrailingCommas(text) {
			let out = '';
			let i = 0, inStr = false, quote = null, esc = false;
	
			while (i < text.length) {
				const c = text[i];
	
				if (inStr) {
					out += c;
					if (esc) { esc = false; }
					else if (c === '\\') { esc = true; }
					else if (c === quote) { inStr = false; quote = null; }
					i++; continue;
				}
	
				if (c === '"' || c === "'") { inStr = true; quote = c; out += c; i++; continue; }
	
				if (c === ',') {
					// lookahead non-whitespace
					let j = i + 1;
					while (j < text.length && /\s/.test(text[j])) j++;
					if (j < text.length && (text[j] === '}' || text[j] === ']')) {
						// skip this comma
						i++; continue;
					}
				}
	
				out += c; i++;
			}
	
			return out;
		}
	
		function fixSingleQuotedKeysAndValues(text) {
			// 'key': → "key":
			text = text.replace(/'((?:\\.|[^'\\])*)'\s*:/g, (_, key) => {
				return `"${key.replace(/"/g, '\\"')}":`;
			});
			// : 'value' → : "value"
			text = text.replace(/:\s*'((?:\\.|[^'\\])*)'/g, (_, val) => {
				return `: "${val.replace(/"/g, '\\"')}"`;
			});
			return text;
		}
	
		function fixBarewordKeys(text) {
			// { key: 1 } → { "key": 1 }
			return text.replace(/([{\[,]\s*)([A-Za-z_][A-Za-z0-9_\-$]*)\s*:/g, '$1"$2":');
		}
	
		function trimOuterNonJson(text) {
			// If text has leading or trailing junk, try trimming to outermost braces/brackets
			const first = text.search(/[{\[]/);
			const lastCurly = text.lastIndexOf('}');
			const lastSquare = text.lastIndexOf(']');
			const last = Math.max(lastCurly, lastSquare);
			if (first >= 0 && last > first) return text.slice(first, last + 1).trim();
			return text;
		}
	}

	if (typeof AiTester=='undefined') {
		Tester.Assert('Playwright.GetElementByAiQuery requires AiTester global page object to be added to the current framework.', false);
		return false;
	}

	_PlaywrightInit();
	const snap = _PlaywrightSyncRun(()=>_DoInvokeForCurrentBrowser(async ({page})=>{
		const snap = await page._snapshotForAI();
		return snap;
	}));
	
	Log(snap);

	// AITester magic goes here
	let ref = undefined;
	
	const prompt = `
You goal is to help me recognizing an element on the web page. The element description will be provided. I send you page screenshot image and ARIA description of the page.
What I need is just ref id of the element. I.e. you need to output one of the following JSON depending on the result:

Output JSON:
{"ref":"e21", "details": "- searchbox "Search Anything" [ref=e25]"}

Output JSON:
{"ref":"f1e24", "details":"- combobox [ref=f1e24] [cursor=pointer]: Notebook Basic 17"}

If element is not found, then it has no reference and output is the following:

Output JSON:
{"ref":null, "details":"I was unable to find an input field 'username' on the current page. I can neither see it on the screenshot nor find it in the ARIA snapshot"}

If element description is unclear or there are more than one matches, the output may be:

Output JSON:
{"ref":null, "details":"I was unable to a single element from the provided description. There are many possible matches, i.e. <information about first few matches>"}

Output JSON only, no additional speculations.

Here goes page ARIA snapshot:
========================
${snap}
========================

Here goes element description:
========================
${query}
========================

Output JSON:
`;
	
	
	try {
		const response = AiTester.DoWebImageQuery(prompt);
		const jsres = parseLLMJson(response);
		if (jsres.ref) {
			ref = jsres.ref;
		} else {
			Log(`Problems recognizing an element: ${jsres.detals}`);
			return false;
		}
	} catch(parseError) {
		Log(`Error parsing AI response: ${response} ${parseError}`);
		return false;
	}
	
	const fullXPath = _PlaywrightSyncRun(()=>_DoInvokeForCurrentBrowser(async ({page})=>{
		const snap = await page._snapshotForAI();
		// Now find an element by ref
		const foundEl = await page.locator(`aria-ref=${ref}`);
		const xpathChain = await getXPathChain(page, foundEl);
		return xpathChain.join('@@@');
	}));
	
	const /**HTMLObject*/el = Navigator.Find(fullXPath);
	if (el)
	{
		el.highlight();
	
		return el;
	} else {
		return false;
	}
}