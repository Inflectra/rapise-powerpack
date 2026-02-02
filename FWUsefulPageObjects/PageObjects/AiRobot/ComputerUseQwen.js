"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputerUseQwen = void 0;
const ComputerUseTypes_1 = require("./ComputerUseTypes");
const deasync_1 = __importDefault(require("deasync"));
class ComputerUseQwen {
    // Qwen coordinate space is ALWAYS 0..1000
    static mapCoord1000ToPhysical(coord1000, imgMeta) {
        const w = imgMeta.metadata_scaled.width || 1024;
        const h = imgMeta.metadata_scaled.height || 768;
        // 0..1000 -> scaled canvas pixels
        const scaledX = Math.floor(coord1000[0] * (w - 1) / 999);
        const scaledY = Math.floor(coord1000[1] * (h - 1) / 999);
        console.log(`${coord1000[0]},${coord1000[1]}-->${scaledX},${scaledY} (w: ${JSON.stringify(imgMeta.metadata_scaled)})`);
        // scaled canvas -> physical screen pixels (undo scaling)
        return [scaledX, scaledY];
    }
    static getScreenshot(window) {
        const base64Image = window.GetScreenshot();
        const imageBuffer = Buffer.from(base64Image, "base64");
        //this.imgMeta = ComputerUseUtils.wrapImage(imageBuffer,{width:512,height:512});
        this.imgMeta = ComputerUseTypes_1.ComputerUseUtils.wrapImage(imageBuffer);
        let scaledImageBuffer = undefined;
        this.imgMeta.img_scaled
            .toBuffer()
            .then((buf) => {
            scaledImageBuffer = buf;
        })
            .catch((err) => {
            window.Log("Error scaling image: " + err.message);
            scaledImageBuffer = Buffer.from("");
        });
        while (scaledImageBuffer === undefined) {
            deasync_1.default.runLoopOnce();
        }
        return scaledImageBuffer.toString("base64");
    }
    static buildToolSystemPrompt(displayW = 1000, displayH = 1000) {
        // Keep this aligned with the python NousFnCallPrompt template.
        const computerUseFn = {
            type: "function",
            function: {
                name: "computer_use",
                description: "Use a mouse and keyboard to interact with a computer, and take screenshots.\n" +
                    "* This is an interface to a desktop GUI. You do not have access to a terminal or applications menu. You must click on desktop icons to start applications.\n" +
                    "* Some applications may take time to start or process actions, so you may need to wait and take successive screenshots to see the results of your actions.\n" +
                    `* The screen's resolution is ${displayW}x${displayH}.\n` +
                    `* Use keyboard to interact with combo dropdowns (when value is not visible on the screen) and long lists (quick type to search, home/end, page up/page down). Prefer keyboard to scrolling whenever possible.\n` +
                    "* Whenever you intend to move the cursor to click on an element like an icon, you should consult a screenshot to determine the coordinates of the element before moving the cursor.\n" +
                    "* Make sure to click any buttons, links, icons, etc with the cursor tip in the center of the element. If it is an input field, point cursor tip to the center of current value. Don't click boxes on their edges." +
                    "",
                parameters: {
                    type: "object",
                    required: ["action"],
                    properties: {
                        action: {
                            type: "string",
                            enum: [
                                "key",
                                "type",
                                "mouse_move",
                                "left_click",
                                "left_click_drag",
                                "right_click",
                                "middle_click",
                                "double_click",
                                "triple_click",
                                "scroll",
                                "hscroll",
                                "wait",
                                "terminate",
                                "answer",
                            ],
                            description: `
* \`key\`: Performs key down presses on the arguments passed in order, then performs key releases in reverse order.
* \`type\`: Type a string of text on the keyboard.
* \`mouse_move\`: Move the cursor to a specified (x, y) pixel coordinate on the screen.
* \`left_click\`: Click the left mouse button at a specified (x, y) pixel coordinate on the screen.
* \`left_click_drag\`: Click and drag the cursor to a specified (x, y) pixel coordinate on the screen.
* \`right_click\`: Click the right mouse button at a specified (x, y) pixel coordinate on the screen.
* \`middle_click\`: Click the middle mouse button at a specified (x, y) pixel coordinate on the screen.
* \`double_click\`: Double-click the left mouse button at a specified (x, y) pixel coordinate on the screen.
* \`triple_click\`: Triple-click the left mouse button at a specified (x, y) pixel coordinate on the screen.
* \`scroll\`: Performs a scroll of the mouse scroll wheel.
* \`hscroll\`: Performs a horizontal scroll (mapped to regular scroll).
* \`wait\`: Wait specified seconds for the change to happen.
* \`terminate\`: Terminate the current task and report its completion status.
* \`answer\`: Answer a question.
`
                        },
                        keys: { type: "array", description: "Required only by action=key." },
                        text: {
                            type: "string",
                            description: "Required only by action=type and action=answer.",
                        },
                        coordinate: {
                            type: "array",
                            description: "(x,y) in 0..1000 coordinate space. Required for mouse_move/click/drag actions.",
                        },
                        pixels: {
                            type: "number",
                            description: "Scroll amount. Positive=up, negative=down. Required for scroll/hscroll.",
                        },
                        time: {
                            type: "number",
                            description: "Seconds to wait. Required for wait.",
                        },
                        status: {
                            type: "string",
                            enum: ["success", "failure"],
                            description: "Required only for terminate.",
                        },
                    },
                },
            },
        };
        const rapiseAssertFn = {
            type: "function",
            function: {
                name: "rapise_assert",
                description: "Perform an assertion during the automation process. Only do this when user asks to check or validate something explicitly.",
                parameters: {
                    type: "object",
                    required: ["text", "pass"],
                    properties: {
                        text: { type: "string" },
                        pass: { type: "boolean" },
                        additionalData: { type: "string" },
                    },
                },
            },
        };
        const rapiseSetReturnValueFn = {
            type: "function",
            function: {
                name: "rapise_set_return_value",
                description: "Set a return value for later use. Do this when user asks to store a value for later use or to capture some value.",
                parameters: {
                    type: "object",
                    required: ["val"],
                    properties: {
                        val: { type: ["string", "number", "boolean"] },
                    },
                },
            },
        };
        const rapisePrintMessageFn = {
            type: "function",
            function: {
                name: "rapise_print_message",
                description: "Log a message during the automation process. Do this when user explicitly asks to output or print something.",
                parameters: {
                    type: "object",
                    required: ["text"],
                    properties: { text: { type: "string" } },
                },
            },
        };
        const toolDescs = [
            computerUseFn,
            rapiseAssertFn,
            rapiseSetReturnValueFn,
            rapisePrintMessageFn,
        ].map((x) => JSON.stringify(x));
        return (`# Tools

You may call one or more functions to assist with the user query.

You are provided with function signatures within <tools></tools> XML tags:
<tools>${toolDescs.join("\n")}
</tools>

For each function call, return a json object with function name and arguments within <tool_call></tool_call> XML tags:
<tool_call>
{"name": <function-name>, "arguments": <args-json-object>}
</tool_call>

# Interactions

If input field and its current value is not properly visible, scroll it into view using the 'scroll' tool.
If field is close to the edge and you may scroll it, then first scroll the field into view properly.
If you are activating a text input field for typing, use <tool_call>{"name": "computer_use", "arguments": {"action":"triple_click",...}}</tool_call> to select current value.

# Response format

Response format for every step:
1) Action: a short imperative describing what to do in the UI.
2) A single <tool_call>...</tool_call> block containing only the JSON: {"name": <function-name>, "arguments": <args-json-object>}.

Rules:
- Output exactly in the order: Action, <tool_call>.
- Be brief: one sentence for Action.
- Do not output anything else outside those parts.
- If finishing, use action=terminate in the tool call.
`);
    }
    static queryLlm(payload, chatStatus) {
        var _a, _b;
        const resp = AiServerClient.QueryRaw(payload);
        chatStatus.prompt_queries += 1;
        chatStatus.input_tokens += ((_a = resp.usage) === null || _a === void 0 ? void 0 : _a.prompt_tokens) || 0;
        chatStatus.output_tokens += ((_b = resp.usage) === null || _b === void 0 ? void 0 : _b.completion_tokens) || 0;
        return resp;
    }
    static extractToolCalls(text, response) {
        var _a, _b, _c;
        const calls = [];
        // First, try to extract from OpenAI-style tool_calls in the response object
        if ((_c = (_b = (_a = response === null || response === void 0 ? void 0 : response.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.tool_calls) {
            const toolCalls = response.choices[0].message.tool_calls;
            for (const toolCall of toolCalls) {
                if (toolCall.type === "function" && toolCall.function) {
                    try {
                        const args = typeof toolCall.function.arguments === "string"
                            ? JSON.parse(toolCall.function.arguments)
                            : toolCall.function.arguments;
                        calls.push({
                            name: toolCall.function.name,
                            arguments: args
                        });
                    }
                    catch (e) {
                        // ignore malformed tool calls
                    }
                }
            }
        }
        // If we found tool calls in the response object, return them
        if (calls.length > 0) {
            return { calls, text };
        }
        // Fallback: try to extract from XML-style tool calls in text content
        if (!text)
            return { calls: [], text };
        const re = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/g;
        let m;
        while ((m = re.exec(text)) !== null) {
            const raw = (m[1] || "").trim();
            if (!raw)
                continue;
            try {
                const obj = JSON.parse(raw);
                if (obj && typeof obj.name === "string" && obj.arguments) {
                    calls.push(obj);
                }
            }
            catch (_d) {
                // ignore malformed blocks
            }
        }
        // Only keep Action: and remove the <tool_call> part.
        const cleanedText = text.split('<tool_call>')[0];
        return { calls, text: cleanedText };
    }
    static toolResponseText(obj) {
        // Mirror NousFnCallPrompt: FUNCTION => USER with <tool_response> wrapper.
        // Keep it simple: put JSON payload inside.
        const body = JSON.stringify(obj !== null && obj !== void 0 ? obj : {}, null, 2);
        return `<tool_response>\n${body}\n</tool_response>`;
    }
    static handleRapiseFunction(window, name, args) {
        switch (name) {
            case "rapise_assert": {
                const { text, pass, additionalData } = args || {};
                if (typeof text !== "string" || typeof pass !== "boolean") {
                    return new ComputerUseTypes_1.ToolResult({ error: "rapise_assert requires {text:string, pass:boolean}" });
                }
                window.Assert(text, pass, additionalData);
                return new ComputerUseTypes_1.ToolResult({ output: `Assertion executed: ${text} => ${pass}` });
            }
            case "rapise_set_return_value": {
                const { val } = args || {};
                if (val === undefined) {
                    return new ComputerUseTypes_1.ToolResult({ error: "rapise_set_return_value requires {val}" });
                }
                window.SetReturnValue(val);
                return new ComputerUseTypes_1.ToolResult({ output: `Return value set: ${val}` });
            }
            case "rapise_print_message": {
                const { text } = args || {};
                if (typeof text !== "string") {
                    return new ComputerUseTypes_1.ToolResult({ error: "rapise_print_message requires {text:string}" });
                }
                window.PrintReportMessage(text);
                return new ComputerUseTypes_1.ToolResult({ output: `Message logged: ${text}` });
            }
            default:
                return new ComputerUseTypes_1.ToolResult({ error: `Unknown function: ${name}` });
        }
    }
    static mouseMove(window, chatStatus, c, action) {
        if (c[0] < 0) {
            return new ComputerUseTypes_1.ToolResult({ error: `${action} x should be >= 0, now it is ${c[0]}` });
        }
        if (c[1] < 0) {
            return new ComputerUseTypes_1.ToolResult({ error: `${action} y should be >= 0, now it is ${c[1]}` });
        }
        if (c[0] >= 1000) {
            return new ComputerUseTypes_1.ToolResult({ error: `${action} x should be < 1000, now it is ${c[0]}` });
        }
        if (c[1] >= 1000) {
            return new ComputerUseTypes_1.ToolResult({ error: `${action} y should be < 1000, now it is ${c[1]}` });
        }
        const [x, y] = this.mapCoord1000ToPhysical(c, this.imgMeta);
        window.DoMouseMove(x, y + 5);
        chatStatus.tool_invocations += 1;
        if (action == "mouse_move") {
            return new ComputerUseTypes_1.ToolResult({ output: `Mouse moved to (${x}, ${y})` });
        }
        return null;
    }
    static handleComputerUse(window, args, chatStatus) {
        var _a, _b, _c, _d, _e;
        const action = args === null || args === void 0 ? void 0 : args.action;
        if (!action)
            return new ComputerUseTypes_1.ToolResult({ error: "computer_use requires {action}" });
        try {
            switch (action) {
                case "mouse_move": {
                    const c = args.coordinate;
                    if (!c)
                        return new ComputerUseTypes_1.ToolResult({ error: "mouse_move requires coordinate" });
                    const r = this.mouseMove(window, chatStatus, c, 'mouse_move');
                    return r;
                }
                case "left_click":
                case "right_click":
                case "middle_click":
                case "double_click":
                case "triple_click": {
                    const c = args.coordinate;
                    let clickType = "L";
                    if (action === "right_click")
                        clickType = "R";
                    if (action === "middle_click")
                        clickType = "M";
                    if (action === "double_click")
                        clickType = "LD";
                    const r = this.mouseMove(window, chatStatus, c, action);
                    if (r) {
                        Global.DoSleep(300);
                        return r;
                    }
                    if (action === "triple_click") {
                        // closest available: double + single (same as your Anthropic)
                        window.DoClick("LD");
                        window.DoClick("L");
                    }
                    else {
                        window.DoClick(clickType);
                    }
                    Global.DoSleep(500);
                    chatStatus.tool_invocations += 1;
                    return new ComputerUseTypes_1.ToolResult({ output: `Click action: ${action}` });
                }
                case "left_click_drag": {
                    const c = args.coordinate;
                    if (!c)
                        return new ComputerUseTypes_1.ToolResult({ error: "left_click_drag requires coordinate" });
                    const [x, y] = this.mapCoord1000ToPhysical(c, this.imgMeta);
                    window.DoMouseDragTo(x, y);
                    chatStatus.tool_invocations += 1;
                    return new ComputerUseTypes_1.ToolResult({ output: `Dragged to (${x}, ${y})` });
                }
                case "key": {
                    const keys = (args.keys || []);
                    if (!Array.isArray(keys) || keys.length === 0) {
                        return new ComputerUseTypes_1.ToolResult({ error: "key requires keys[]" });
                    }
                    // Join keys with '+' for combinations (e.g., ["ctrl", "a"] becomes "ctrl+a")
                    const keyCombo = keys.join("+");
                    const sendKey = ComputerUseTypes_1.ComputerUseUtils.convertToSendKeys(keyCombo);
                    window.DoSendKeys(sendKey);
                    chatStatus.tool_invocations += 1;
                    return new ComputerUseTypes_1.ToolResult({ output: `Key combination sent: ${keyCombo} -> ${sendKey}` });
                }
                case "type": {
                    const text = String((_a = args.text) !== null && _a !== void 0 ? _a : "");
                    if (!text)
                        return new ComputerUseTypes_1.ToolResult({ error: "type requires text" });
                    const c = args.coordinate;
                    if (c) {
                        // Activate field with triple_click
                        const r = this.mouseMove(window, chatStatus, c, action);
                        if (r) {
                            window.DoClick("LD");
                            window.DoClick("L");
                        }
                    }
                    else {
                        window.DoSendKeys("^a{DEL}");
                    }
                    window.DoSendKeys(ComputerUseTypes_1.ComputerUseUtils.escapeSendKeysSpecialChars(text));
                    chatStatus.tool_invocations += 1;
                    return new ComputerUseTypes_1.ToolResult({ output: `Typed: ${text}` });
                }
                case "scroll":
                case "hscroll": {
                    const pixels1000 = Number((_b = args.pixels) !== null && _b !== void 0 ? _b : 0);
                    // Scale scroll amount from 1000-space to physical pixels
                    const h = this.imgMeta.metadata_scaled.height || 768;
                    const scaledPixels = Math.round((pixels1000 / 1000) * h);
                    // Map to vertical scroll only (like python note for hscroll)
                    window.DoScroll(0, scaledPixels);
                    Global.DoSleep(500);
                    chatStatus.tool_invocations += 1;
                    return new ComputerUseTypes_1.ToolResult({ output: `Scrolled: ${pixels1000} (1000-space) -> ${scaledPixels} (physical pixels)` });
                }
                case "wait": {
                    const t = Number((_c = args.time) !== null && _c !== void 0 ? _c : 0);
                    const ms = Math.max(0, Math.round(t * 1000));
                    Global.DoSleep(ms);
                    chatStatus.tool_invocations += 1;
                    return new ComputerUseTypes_1.ToolResult({ output: `Waited: ${t}s` });
                }
                case "answer": {
                    const text = String((_d = args.text) !== null && _d !== void 0 ? _d : "");
                    window.AssistantText(text);
                    window.SetReturnValue(text);
                    chatStatus.tool_invocations += 1;
                    return new ComputerUseTypes_1.ToolResult({ output: `Answer: ${text}` });
                }
                case "terminate": {
                    const status = String((_e = args.status) !== null && _e !== void 0 ? _e : "failure");
                    chatStatus.stop_reason = "terminate";
                    chatStatus.success = status === "success";
                    chatStatus.tool_invocations += 1;
                    return new ComputerUseTypes_1.ToolResult({ output: `Terminated: ${status}` });
                }
                default:
                    return new ComputerUseTypes_1.ToolResult({ error: `Unsupported action: ${action}` });
            }
        }
        catch (e) {
            return new ComputerUseTypes_1.ToolResult({ error: (e === null || e === void 0 ? void 0 : e.message) || String(e) });
        }
    }
    static toolUseLoopA(prompt, window, system_prompt, max_tokens = 10000, // (not always honored by DashScope compatible mode)
    n_last_images = 2, // keep recent screenshot context
    timeout = 600000, token_limit = 1000000) {
        var _a, _b, _c, _d, _e;
        const chatStatus = {
            start: new Date(),
            prompt,
            input_tokens: 0,
            output_tokens: 0,
            stop_reason: "",
            success: false,
            tool_invocations: 0,
            prompt_queries: 0,
        };
        window.Log(prompt);
        const toolSystem = this.buildToolSystemPrompt(1000, 1000);
        const fullSystem = system_prompt ? `${system_prompt}\n\n${toolSystem}` : toolSystem;
        // Initial screenshot (scaled/padded by ComputerUseUtils)
        const scaledBase64 = this.getScreenshot(window);
        const messages = [
            {
                role: "system",
                content: [{ type: "text", text: fullSystem }],
            },
            {
                role: "user",
                content: [
                    { type: "image_url", image_url: { url: `data:image/png;base64,${scaledBase64}` } },
                    { type: "text", text: ComputerUseQwen.user_prompt_prefix + "\n\n" + prompt },
                ],
            },
        ];
        const startMs = Date.now();
        while (true) {
            if (Date.now() - startMs >= timeout) {
                chatStatus.stop_reason = "timeout";
                chatStatus.success = false;
                window.Log("Qwen toolUseLoop timed out.");
                break;
            }
            if (chatStatus.input_tokens + chatStatus.output_tokens >= token_limit) {
                chatStatus.stop_reason = "token_limit";
                chatStatus.success = false;
                window.Log("Qwen toolUseLoop token limit reached.");
                break;
            }
            // Qwen call
            const payload = Object.assign({ messages, temperature: 0.0, top_p: 0.9 }, (max_tokens > 0 && { max_tokens }));
            let resp = this.queryLlm(payload, chatStatus);
            if (resp === null || resp === void 0 ? void 0 : resp.error) {
                window.Log("Error in Qwen response: " + JSON.stringify(resp.error, null, 2) + " Re-trying.");
                resp = this.queryLlm(payload, chatStatus);
            }
            if (resp === null || resp === void 0 ? void 0 : resp.error) {
                window.Log("Error in Qwen response: " + JSON.stringify(resp.error, null, 2));
                chatStatus.stop_reason = "error_in_response";
                chatStatus.success = false;
                break;
            }
            const assistantText = ((_c = (_b = (_a = resp === null || resp === void 0 ? void 0 : resp.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) || "";
            // Register for debugging/replay parity with other implementations
            try {
                window.RegisterResponse(payload, resp, chatStatus, this.imgMeta);
            }
            catch (_f) {
                // ignore if older TargetWindow impl differs
            }
            const { calls: toolCalls, text: cleanedText } = this.extractToolCalls(assistantText, resp);
            messages.push({
                role: "assistant",
                content: [{ type: "text", text: cleanedText }],
            });
            if (!toolCalls.length) {
                // No tool calls => treat as completion
                chatStatus.stop_reason = ((_e = (_d = resp === null || resp === void 0 ? void 0 : resp.choices) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.finish_reason) || "end_turn";
                chatStatus.success = true;
                break;
            }
            const toolResponses = [];
            // Execute tool calls sequentially, after each call send back tool_response + new screenshot
            for (let i = 0; i < toolCalls.length; i++) {
                const tc = toolCalls[i];
                const actionKey = `${tc.name}-${i}`;
                window.ActionStart(actionKey, `Qwen tool: ${tc.name}`);
                toolResponses.push(JSON.stringify(tc));
                let result;
                if (tc.name === "computer_use") {
                    result = this.handleComputerUse(window, tc.arguments, chatStatus);
                }
                else if (tc.name === "rapise_assert" ||
                    tc.name === "rapise_set_return_value" ||
                    tc.name === "rapise_print_message") {
                    result = this.handleRapiseFunction(window, tc.name, tc.arguments);
                }
                else {
                    // Handle cases where the action is passed directly as tool name (legacy compatibility)
                    const computerUseActions = [
                        "key", "type", "mouse_move", "left_click", "left_click_drag",
                        "right_click", "middle_click", "double_click", "triple_click",
                        "scroll", "hscroll", "wait", "terminate", "answer"
                    ];
                    if (computerUseActions.includes(tc.name)) {
                        // Treat the tool name as a computer_use action
                        result = this.handleComputerUse(window, Object.assign({ action: tc.name }, tc.arguments), chatStatus);
                    }
                    else {
                        result = new ComputerUseTypes_1.ToolResult({ error: `Unsupported tool name: ${tc.name}` });
                    }
                }
                window.ActionEnd(actionKey, JSON.stringify(result, null, 2));
                // If terminate was requested, stop right away (still send a final tool_response)
                const toolRespObj = {
                    name: tc.name,
                    ok: !result.error,
                    output: result.output,
                    error: result.error,
                };
                toolResponses.push(JSON.stringify(toolRespObj));
                const nextScaledBase64 = this.getScreenshot(window);
                // Keep the last N screenshot messages to avoid ballooning context.
                // Remove image_url content from older messages while preserving text content.
                if (n_last_images > 0) {
                    const userMessagesWithImages = [];
                    for (let mi = 0; mi < messages.length; mi++) {
                        const msg = messages[mi];
                        if (msg.role === "user" && msg.content.some((c) => c.type === "image_url")) {
                            userMessagesWithImages.push(mi);
                        }
                    }
                    // Remove images from older messages, keeping only the most recent n_last_images
                    const imagesToRemove = userMessagesWithImages.length - n_last_images;
                    if (imagesToRemove > 0) {
                        for (let k = 0; k < imagesToRemove; k++) {
                            const msgIdx = userMessagesWithImages[k];
                            const msg = messages[msgIdx];
                            // Keep only text content, remove image_url content
                            msg.content = msg.content.filter(c => c.type !== "image_url");
                        }
                    }
                }
                messages.push({
                    role: "user",
                    content: [
                        { type: "image_url", image_url: { url: `data:image/png;base64,${nextScaledBase64}` } },
                        { type: "text", text: this.toolResponseText(toolRespObj) },
                    ],
                });
                if (chatStatus.stop_reason === "terminate") {
                    // stop after sending tool_response
                    break;
                }
            }
            // Show assistant message (but DO NOT depend on it containing tool calls)
            if (assistantText) {
                toolResponses.unshift(assistantText);
            }
            else {
                toolResponses.unshift(`Calling ${toolCalls.length} tools.`);
            }
            window.Log(toolResponses);
            if (chatStatus.stop_reason === "terminate") {
                break;
            }
        }
        chatStatus.end = new Date();
        chatStatus.duration = chatStatus.end.getTime() - chatStatus.start.getTime();
        return chatStatus;
    }
    /**
     * toolUseLoop2 - mimics the 'predict' method from qwen3vl_agent.py
     *
     * Key differences from toolUseLoop:
     * - History is built by interleaving past screenshots and responses
     * - First history message includes instruction prompt, subsequent ones just have image
     * - Current screenshot is added at the end separately
     */
    static toolUseLoop(prompt, window, system_prompt, max_tokens = 32768, history_n = 4, // number of history steps to include
    timeout = 600000, token_limit = 1000000) {
        var _a, _b, _c, _d, _e;
        const chatStatus = {
            start: new Date(),
            prompt,
            input_tokens: 0,
            output_tokens: 0,
            stop_reason: "",
            success: false,
            tool_invocations: 0,
            prompt_queries: 0,
        };
        window.Log(prompt);
        const toolSystem = this.buildToolSystemPrompt(1000, 1000);
        const fullSystem = system_prompt ? `${system_prompt}\n\n${toolSystem}` : toolSystem;
        // Track history like Python agent
        const responses = [];
        const screenshots = [];
        const startMs = Date.now();
        while (true) {
            if (Date.now() - startMs >= timeout) {
                chatStatus.stop_reason = "timeout";
                chatStatus.success = false;
                window.Log("Qwen toolUseLoop2 timed out.");
                break;
            }
            if (chatStatus.input_tokens + chatStatus.output_tokens >= token_limit) {
                chatStatus.stop_reason = "token_limit";
                chatStatus.success = false;
                window.Log("Qwen toolUseLoop2 token limit reached.");
                break;
            }
            // Get current screenshot
            const currentScreenshot = this.getScreenshot(window);
            screenshots.push(currentScreenshot);
            const currentStep = responses.length;
            const historyStartIdx = Math.max(0, currentStep - history_n);
            // Build previous actions string (for steps before history window)
            const previousActions = [];
            for (let i = 0; i < historyStartIdx; i++) {
                if (i < responses.length) {
                    // Extract action description from response
                    const actionMatch = responses[i].match(/Action:\s*(.+)/i);
                    const actionDesc = actionMatch ? actionMatch[1].trim() : responses[i].substring(0, 100);
                    previousActions.push(`Step ${i + 1}: ${actionDesc}`);
                }
            }
            const previousActionsStr = previousActions.length > 0 ? previousActions.join("\n") : "None";
            const instructionPrompt = `
Please generate the next move according to the UI screenshot, instruction and previous actions.

Instruction: ${prompt}

Previous actions:
${previousActionsStr}`;
            // Build messages like Python predict method
            const messages = [
                {
                    role: "system",
                    content: [{ type: "text", text: fullSystem }],
                },
            ];
            const historyLen = Math.min(history_n, responses.length);
            if (historyLen > 0) {
                // Get history slices
                const historyResponses = responses.slice(-historyLen);
                const historyScreenshots = screenshots.slice(-historyLen - 1, -1);
                for (let idx = 0; idx < historyLen; idx++) {
                    if (idx < historyScreenshots.length) {
                        const screenshotB64 = historyScreenshots[idx];
                        const imgUrl = `data:image/png;base64,${screenshotB64}`;
                        if (idx === 0) {
                            // First history message includes instruction prompt
                            messages.push({
                                role: "user",
                                content: [
                                    { type: "image_url", image_url: { url: imgUrl } },
                                    { type: "text", text: instructionPrompt },
                                ],
                            });
                        }
                        else {
                            // Subsequent history messages just have image
                            messages.push({
                                role: "user",
                                content: [
                                    { type: "image_url", image_url: { url: imgUrl } },
                                ],
                            });
                        }
                    }
                    // Add assistant response
                    messages.push({
                        role: "assistant",
                        content: [{ type: "text", text: historyResponses[idx] }],
                    });
                }
                // Add current screenshot
                messages.push({
                    role: "user",
                    content: [
                        { type: "image_url", image_url: { url: `data:image/png;base64,${currentScreenshot}` } },
                    ],
                });
            }
            else {
                // No history - first message with instruction and current screenshot
                messages.push({
                    role: "user",
                    content: [
                        { type: "image_url", image_url: { url: `data:image/png;base64,${currentScreenshot}` } },
                        { type: "text", text: instructionPrompt },
                    ],
                });
            }
            // Query LLM
            const payload = Object.assign({ messages, temperature: 0.1 }, (max_tokens > 0 && { max_tokens }));
            let resp = this.queryLlm(payload, chatStatus);
            if (resp === null || resp === void 0 ? void 0 : resp.error) {
                window.Log("Error in Qwen response: " + JSON.stringify(resp.error, null, 2) + " Re-trying.");
                resp = this.queryLlm(payload, chatStatus);
            }
            if (resp === null || resp === void 0 ? void 0 : resp.error) {
                window.Log("Error in Qwen response: " + JSON.stringify(resp.error, null, 2));
                chatStatus.stop_reason = "error_in_response";
                chatStatus.success = false;
                break;
            }
            const assistantText = ((_c = (_b = (_a = resp === null || resp === void 0 ? void 0 : resp.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) || "";
            // Register for debugging
            try {
                window.RegisterResponse(payload, resp, chatStatus, this.imgMeta);
            }
            catch (_f) {
                // ignore if older TargetWindow impl differs
            }
            // Store response in history
            responses.push(assistantText);
            const { calls: toolCalls, text: cleanedText } = this.extractToolCalls(assistantText, resp);
            if (!toolCalls.length) {
                // No tool calls => treat as completion
                chatStatus.stop_reason = ((_e = (_d = resp === null || resp === void 0 ? void 0 : resp.choices) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.finish_reason) || "end_turn";
                chatStatus.success = true;
                break;
            }
            const toolResponses = [];
            // Execute tool calls
            for (let i = 0; i < toolCalls.length; i++) {
                const tc = toolCalls[i];
                const actionKey = `${tc.name}-${i}`;
                window.ActionStart(actionKey, `Qwen tool: ${tc.name}`);
                toolResponses.push(JSON.stringify(tc));
                let result;
                if (tc.name === "computer_use") {
                    result = this.handleComputerUse(window, tc.arguments, chatStatus);
                }
                else if (tc.name === "rapise_assert" ||
                    tc.name === "rapise_set_return_value" ||
                    tc.name === "rapise_print_message") {
                    result = this.handleRapiseFunction(window, tc.name, tc.arguments);
                }
                else {
                    const computerUseActions = [
                        "key", "type", "mouse_move", "left_click", "left_click_drag",
                        "right_click", "middle_click", "double_click", "triple_click",
                        "scroll", "hscroll", "wait", "terminate", "answer"
                    ];
                    if (computerUseActions.includes(tc.name)) {
                        result = this.handleComputerUse(window, Object.assign({ action: tc.name }, tc.arguments), chatStatus);
                    }
                    else {
                        result = new ComputerUseTypes_1.ToolResult({ error: `Unsupported tool name: ${tc.name}` });
                    }
                }
                window.ActionEnd(actionKey, JSON.stringify(result, null, 2));
                const toolRespObj = {
                    name: tc.name,
                    ok: !result.error,
                    output: result.output,
                    error: result.error,
                };
                toolResponses.push(JSON.stringify(toolRespObj));
                if (chatStatus.stop_reason === "terminate") {
                    break;
                }
            }
            // Log tool responses
            if (assistantText) {
                toolResponses.unshift(assistantText);
            }
            else {
                toolResponses.unshift(`Calling ${toolCalls.length} tools.`);
            }
            window.Log(toolResponses, 2);
            if (chatStatus.stop_reason === "terminate") {
                break;
            }
        }
        chatStatus.end = new Date();
        chatStatus.duration = chatStatus.end.getTime() - chatStatus.start.getTime();
        return chatStatus;
    }
}
exports.ComputerUseQwen = ComputerUseQwen;
ComputerUseQwen.user_prompt_prefix2 = `Explain your intent before doing each step.

After activating text field for typing check if there is current value and if it is selected. If current value is not selected, use action: triple_click to select current value before typing.
If input field and its current value is not properly visible, scroll it into view using the 'scroll' tool.
If field is close to the edge and you may scroll it, then first scroll the field into view properly.

`;
ComputerUseQwen.user_prompt_prefix = ``;
//# sourceMappingURL=ComputerUseQwen.js.map