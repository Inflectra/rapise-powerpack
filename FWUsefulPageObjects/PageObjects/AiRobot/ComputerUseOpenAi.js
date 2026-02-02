"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputerUseOpenAi = void 0;
const ComputerUseTypes_1 = require("./ComputerUseTypes"); // Assuming you have a separate file for types
const deasync_1 = __importDefault(require("deasync"));
class ComputerUseOpenAi {
    static queryLlm(payload, chatStatus) {
        var _a, _b;
        payload._force_responses = true;
        payload._force_model = "computer-use-preview";
        payload.truncation = "auto";
        payload.tools = payload.tools || [
            {
                type: "computer_use_preview",
                display_width: this.imgMeta.metadata_scaled.width,
                display_height: this.imgMeta.metadata_scaled.height,
                environment: "browser",
            },
            {
                name: "rapise_assert",
                type: "function",
                description: "Perform an assertion during the automation process. Only do this when user asks to check or validate something explicitly.",
                parameters: {
                    type: "object",
                    properties: {
                        text: {
                            type: "string",
                            description: "The assertion message or condition",
                        },
                        pass: {
                            type: "boolean",
                            description: "Whether the assertion passed or failed",
                        },
                        additionalData: {
                            type: "string",
                            description: "Optional additional context for the assertion",
                        },
                    },
                    required: ["text", "pass"],
                },
            },
            {
                name: "rapise_set_return_value",
                type: "function",
                description: "Set a return value for later use. Do this when user asks to store a value for later use or to capture some value.",
                parameters: {
                    type: "object",
                    properties: {
                        val: {
                            type: ["string", "number", "boolean"],
                            description: "The value to set",
                        },
                    },
                    required: ["val"],
                },
            },
            {
                name: "rapise_print_message",
                type: "function",
                description: "Log a message during the automation process. Do this when user explicitly asks to output or print something (print to report, show in the report etc)",
                parameters: {
                    type: "object",
                    properties: {
                        text: {
                            type: "string",
                            description: "The message to log",
                        },
                    },
                    required: ["text"],
                },
            },
        ];
        const response = AiServerClient.QueryRaw(payload, { defaultModelApiType: "openai" });
        chatStatus.prompt_queries += 1;
        chatStatus.input_tokens += ((_a = response.usage) === null || _a === void 0 ? void 0 : _a.input_tokens) || 0;
        chatStatus.output_tokens += ((_b = response.usage) === null || _b === void 0 ? void 0 : _b.output_tokens) || 0;
        return response;
    }
    /**
     * Runs a loop that executes computer actions until no 'computer_call' is found.
     * @param window - TargetWindow
     * @param response - The response object containing output and other details.
     * @returns The final response after processing all computer calls.
     */
    static computerUseLoop(window, payload, response, chatStatus, timeout, token_limit) {
        while (true) {
            if (response.error) {
                window.Log("Error in response: " + JSON.stringify(response.error, null, 2));
                chatStatus.success = false;
                chatStatus.stop_reason = "error_in_response";
                break; // Exit the loop on error
            }
            // Process function_call responses
            const functionCalls = response.output.filter((item) => item.type === "function_call");
            if (functionCalls.length > 0) {
                const toolsOutput = [];
                for (const functionCall of functionCalls) {
                    const { name, arguments: args, call_id } = functionCall;
                    window.Log(`Function call detected: ${name} with arguments: ${args}`);
                    // Simulate handling the function call (replace with actual implementation)
                    let result = this.handleFunctionCall(window, name, JSON.parse(args));
                    if (typeof result == 'undefined') {
                        result = "{}";
                    }
                    //toolsOutput.push(functionCall);
                    toolsOutput.push({
                        type: "function_call_output",
                        call_id: call_id,
                        output: result,
                    });
                }
                // Send the result back to the model
                payload = {
                    previous_response_id: response.id,
                    input: toolsOutput
                };
                response = this.queryLlm(payload, chatStatus);
                continue; // Restart the loop after processing function calls
            }
            let action_reasoning = "";
            response.output.forEach((item) => {
                if (item.type === "reasoning" && item.summary && item.summary.length) {
                    if (action_reasoning)
                        action_reasoning += "\n";
                    action_reasoning += item.summary[0].text;
                }
            });
            // Filter for 'computer_call' items in the response output
            const computerCalls = response.output.filter((item) => item.type === "computer_call");
            if (computerCalls.length === 0) {
                window.Log("No computer call found. Output from model:");
                response.output.forEach((item) => {
                    window.Log(JSON.stringify(item, null, 2));
                });
                chatStatus.success = true; // Mark the chat as successful if no computer calls are found
                chatStatus.stop_reason = "no_computer_calls";
                break; // Exit the loop when no computer calls are issued
            }
            // Process the first computer call
            const computerCall = computerCalls[0];
            const lastCallId = computerCall.call_id;
            const action = computerCall.action;
            // Check for pending safety checks
            let acknowledged_safety_checks = undefined;
            if (computerCall.pending_safety_checks && computerCall.pending_safety_checks.length > 0) {
                window.Log("Pending safety checks detected. Handing over to the end user for confirmation.");
                computerCall.pending_safety_checks.forEach((check) => {
                    window.Log(`Safety Check ID: ${check.id}`);
                    window.Log(`Code: ${check.code}`);
                    window.Log(`Message: ${check.message}`);
                });
                // Simulate end-user confirmation (this should be replaced with actual user interaction)
                acknowledged_safety_checks = computerCall.pending_safety_checks.map((check) => ({
                    id: check.id,
                    code: check.code,
                    message: check.message,
                }));
            }
            // Execute the action
            this.handleModelAction(window, action, action_reasoning);
            chatStatus.tool_invocations += 1;
            if ((new Date().getTime() - chatStatus.start.getTime()) > timeout) {
                window.Log(`Timeout reached (${timeout}ms). Exiting the loop.`);
                chatStatus.success = false; // Mark the chat as successful if no computer calls are found
                chatStatus.stop_reason = "timeout";
                break; // Exit the loop when no computer calls are issued
            }
            if (chatStatus.input_tokens > token_limit) {
                window.Log(`Token limit reached (${token_limit}). Exiting the loop.`);
                chatStatus.success = false; // Mark the chat as successful if no computer calls are found
                chatStatus.stop_reason = "token_limit";
                break; // Exit the loop when no computer calls are issued
            }
            Global.DoSleep(g_commandInterval);
            // Take a screenshot after the action
            const screenshotBase64 = this.getScreenshot(window);
            payload = {
                previous_response_id: response.id,
                input: [
                    {
                        call_id: lastCallId,
                        acknowledged_safety_checks,
                        type: "computer_call_output",
                        output: {
                            type: "input_image",
                            image_url: `data:image/png;base64,${screenshotBase64}`,
                        },
                    },
                ]
            };
            response = this.queryLlm(payload, chatStatus);
        }
        return chatStatus;
    }
    static getScreenshot(window) {
        // Take a screenshot after the action
        const base64Image = window.GetScreenshot();
        const imageBuffer = Buffer.from(base64Image, "base64");
        this.imgMeta = ComputerUseTypes_1.ComputerUseUtils.processImage(imageBuffer);
        // Wrap the async toBuffer call in deasync to make it synchronous
        let scaledImageBuffer = undefined;
        this.imgMeta.img_scaled.toBuffer().then(buf => { scaledImageBuffer = buf; }).catch(err => {
            window.Log("Error scaling image: " + err.message);
            scaledImageBuffer = Buffer.from(""); // Return empty buffer on error
        });
        while (scaledImageBuffer === undefined) {
            deasync_1.default.runLoopOnce();
        }
        const scaledBase64Image = scaledImageBuffer.toString("base64");
        return scaledBase64Image;
    }
    /**
     * Handles a function call by executing the corresponding logic.
     * @param name - The name of the function to call.
     * @param args - The arguments for the function.
     * @returns The result of the function call.
     */
    static handleFunctionCall(window, name, args) {
        switch (name) {
            // Rapise tool actions
            case "rapise_assert":
                {
                    const { text, pass, additionalData } = args;
                    if (typeof text !== "string" || typeof pass !== "boolean") {
                        throw new Error("Text and pass must be provided for rapise_assert action.");
                    }
                    window.Log(`Performing assertion: "${text}", Pass: ${pass}`);
                    window.Assert(text, pass, additionalData);
                    break;
                }
            case "rapise_set_return_value":
                {
                    const { val } = args;
                    if (val === undefined) {
                        throw new Error("Value must be provided for rapise_set_return_value action.");
                    }
                    window.Log(`Setting return value to: ${val}`);
                    window.SetReturnValue(val);
                    break;
                }
            case "rapise_print_message":
                {
                    const { text } = args;
                    if (!text) {
                        throw new Error("Text must be provided for rapise_print_message action.");
                    }
                    window.PrintReportMessage(text);
                    window.SetReturnValue(undefined);
                    break;
                }
            default:
                throw new Error(`Unknown function call: ${name}`);
        }
    }
    /**
     * Handles a model action and executes the corresponding operation on the Playwright page.
     * @param page - The Playwright page object.
     * @param action - The action object containing type and parameters.
     */
    static handleModelAction(window, action, action_reasoning) {
        const actionType = action.type;
        window.ActionStart(actionType, action_reasoning || JSON.stringify(action));
        window.Log(`Handling action: ${actionType}`);
        try {
            switch (actionType) {
                case "click": {
                    const { x, y, button = "left" } = action;
                    window.Log(`Action: click at (${x}, ${y}) with button '${button}'`);
                    const [clickX, clickY] = ComputerUseTypes_1.ComputerUseUtils.applyScaling([x, y], this.imgMeta.scale_factor);
                    window.DoMouseMove(clickX, clickY);
                    let clickType = "L";
                    switch (button) {
                        case "right":
                            clickType = "R";
                            break;
                        case "middle":
                            clickType = "M";
                            break;
                        default:
                            clickType = "L";
                            break;
                    }
                    window.DoClick(clickType);
                    break;
                }
                case "scroll": {
                    const { x, y, scroll_x, scroll_y } = action;
                    window.Log(`Action: scroll at (${x}, ${y}) with offsets (scroll_x=${scroll_x}, scrollY=${scroll_y})`);
                    const [clickX, clickY] = ComputerUseTypes_1.ComputerUseUtils.applyScaling([x, y], this.imgMeta.scale_factor);
                    window.DoMouseMove(clickX, clickY);
                    window.DoScroll(scroll_x, scroll_y);
                    break;
                }
                case "drag": {
                    // action = {"type":"drag","path":[{"x":170,"y":633},{"x":65,"y":637}]} 
                    const { path } = action;
                    window.Log(`Action: drag with path ${JSON.stringify(path)}`);
                    if (path.length < 2) {
                        window.Log("Invalid drag path. At least two points are required.");
                        break;
                    }
                    const [start, ...rest] = path;
                    const [startX, startY] = ComputerUseTypes_1.ComputerUseUtils.applyScaling([start.x, start.y], this.imgMeta.scale_factor);
                    window.DoMouseMove(startX, startY);
                    window.DoMousePress("L");
                    for (const point of rest) {
                        const [dragX, dragY] = ComputerUseTypes_1.ComputerUseUtils.applyScaling([point.x, point.y], this.imgMeta.scale_factor);
                        window.DoMouseMove(dragX, dragY);
                    }
                    window.DoMouseRelease("L");
                    break;
                }
                case "keypress": {
                    const { keys } = action;
                    const combinedKeyMap = new Map([
                        // --- Special Keys (Common to Keys & Codes where names overlap) ---
                        [ComputerUseTypes_1.Keys.Enter, "{RETURN}"], // Handles "Enter"
                        [ComputerUseTypes_1.Keys.Tab, "{TAB}"], // Handles "Tab"
                        [ComputerUseTypes_1.Keys.Escape, "{ESCAPE}"], // Handles "Escape"
                        [ComputerUseTypes_1.Keys.Backspace, "{BACKSPACE}"], // Handles "Backspace"
                        [ComputerUseTypes_1.Keys.Delete, "{DELETE}"], // Handles "Delete"
                        [ComputerUseTypes_1.Keys.Insert, "{INSERT}"], // Handles "Insert"
                        [ComputerUseTypes_1.Keys.Pause, "{PAUSE}"], // Handles "Pause"
                        [ComputerUseTypes_1.Keys.CapsLock, "{CAPS_LOCK}"], // Handles "CapsLock"
                        [ComputerUseTypes_1.Keys.ArrowUp, "{ARROW_UP}"], // Handles "ArrowUp"
                        [ComputerUseTypes_1.Keys.ArrowDown, "{ARROW_DOWN}"], // Handles "ArrowDown"
                        [ComputerUseTypes_1.Keys.ArrowLeft, "{ARROW_LEFT}"], // Handles "ArrowLeft"
                        [ComputerUseTypes_1.Keys.ArrowRight, "{ARROW_RIGHT}"], // Handles "ArrowRight"
                        [ComputerUseTypes_1.Keys.PageUp, "{PGUP}"], // Handles "PgUp"
                        [ComputerUseTypes_1.Keys.PageDown, "{PGDN}"], // Handles "PgDn"
                        [ComputerUseTypes_1.Keys.Home, "{HOME}"], // Handles "Home"
                        [ComputerUseTypes_1.Keys.End, "{END}"], // Handles "End"
                        [ComputerUseTypes_1.Keys.PrintScreen, "{PRINT_SCREEN}"], // Handles "PrintScreen"
                        [ComputerUseTypes_1.Keys.ScrollLock, "{SCROLL_LOCK}"], // Handles "ScrollLock"
                        [ComputerUseTypes_1.Keys.NumLock, "{NUM_LOCK}"], // Handles "NumLock"
                        // Function Keys (Common names in Keys & Codes)
                        [ComputerUseTypes_1.Keys.F1, "{F1}"], [ComputerUseTypes_1.Keys.F2, "{F2}"], [ComputerUseTypes_1.Keys.F3, "{F3}"],
                        [ComputerUseTypes_1.Keys.F4, "{F4}"], [ComputerUseTypes_1.Keys.F5, "{F5}"], [ComputerUseTypes_1.Keys.F6, "{F6}"],
                        [ComputerUseTypes_1.Keys.F7, "{F7}"], [ComputerUseTypes_1.Keys.F8, "{F8}"], [ComputerUseTypes_1.Keys.F9, "{F9}"],
                        [ComputerUseTypes_1.Keys.F10, "{F10}"], [ComputerUseTypes_1.Keys.F11, "{F11}"], [ComputerUseTypes_1.Keys.F12, "{F12}"],
                        // Space (Handle Keys.Space = " " or Codes.Space = "Space")
                        [ComputerUseTypes_1.Keys.Space, " "], // Handles " " (from Keys.Space)
                        [ComputerUseTypes_1.Codes.Space, " "], // Handles "Space" (from Codes.Space) -> send literal space
                        // Modifier Keys (Map name to sendKeys code - chord handling is separate)
                        [ComputerUseTypes_1.Keys.Shift, "{SHIFT}"], // Handles "Shift"
                        [ComputerUseTypes_1.Codes.ShiftLeft, "{SHIFT}"], // Handle "ShiftLeft"
                        [ComputerUseTypes_1.Codes.ShiftRight, "{SHIFT}"], // Handle "ShiftRight"
                        [ComputerUseTypes_1.Keys.Control, "{CONTROL}"], // Handles "Control"
                        [ComputerUseTypes_1.Codes.ControlLeft, "{CONTROL}"], // Handle "ControlLeft"
                        [ComputerUseTypes_1.Codes.ControlRight, "{CONTROL}"], // Handle "ControlRight"
                        [ComputerUseTypes_1.Keys.Alt, "{ALT}"], // Handles "Alt"
                        [ComputerUseTypes_1.Codes.AltLeft, "{ALT}"], // Handle "AltLeft"
                        [ComputerUseTypes_1.Codes.AltRight, "{ALT}"], // Handle "AltRight"
                        [ComputerUseTypes_1.Keys.Meta, "{META}"], // Handles "Meta" (Windows/Command key)
                        [ComputerUseTypes_1.Codes.MetaLeft, "{META}"], // Handle "MetaLeft"
                        [ComputerUseTypes_1.Codes.MetaRight, "{META}"], // Handle "MetaRight"
                        // Media Keys (Names common in Keys & Codes)
                        [ComputerUseTypes_1.Keys.AudioVolumeMute, "{VOLUME_MUTE}"], // Handles "AudioVolumeMute"
                        [ComputerUseTypes_1.Keys.AudioVolumeDown, "{VOLUME_DOWN}"], // Handles "AudioVolumeDown"
                        [ComputerUseTypes_1.Keys.AudioVolumeUp, "{VOLUME_UP}"], // Handles "AudioVolumeUp"
                        // Numpad Digits (Codes.Numpad5 -> "{NUMPAD5}" or "5") - Choose based on sendKeys
                        [ComputerUseTypes_1.Codes.Numpad0, "{NUMPAD0}"], // Or "0"
                        [ComputerUseTypes_1.Codes.Numpad1, "{NUMPAD1}"], // Or "1"
                        [ComputerUseTypes_1.Codes.Numpad2, "{NUMPAD2}"], // Or "2"
                        [ComputerUseTypes_1.Codes.Numpad3, "{NUMPAD3}"], // Or "3"
                        [ComputerUseTypes_1.Codes.Numpad4, "{NUMPAD4}"], // Or "4"
                        [ComputerUseTypes_1.Codes.Numpad5, "{NUMPAD5}"], // Or "5"
                        [ComputerUseTypes_1.Codes.Numpad6, "{NUMPAD6}"], // Or "6"
                        [ComputerUseTypes_1.Codes.Numpad7, "{NUMPAD7}"], // Or "7"
                        [ComputerUseTypes_1.Codes.Numpad8, "{NUMPAD8}"], // Or "8"
                        [ComputerUseTypes_1.Codes.Numpad9, "{NUMPAD9}"], // Or "9"
                        // Numpad Operators (Codes.NumpadAdd -> "{NUMPAD_ADD}" or "+")
                        [ComputerUseTypes_1.Codes.NumpadAdd, "{NUMPAD_ADD}"], // Or "+"
                        [ComputerUseTypes_1.Codes.NumpadSubtract, "{NUMPAD_SUBTRACT}"], // Or "-"
                        [ComputerUseTypes_1.Codes.NumpadMultiply, "{NUMPAD_MULTIPLY}"], // Or "*"
                        [ComputerUseTypes_1.Codes.NumpadDivide, "{NUMPAD_DIVIDE}"], // Or "/"
                        [ComputerUseTypes_1.Codes.NumpadDecimal, "{NUMPAD_DECIMAL}"], // Or "."
                        // NumpadEnter often uses the same code as Enter, handled above. Add if needed:
                        // [Codes.NumpadEnter, "{RETURN}"],
                        // Symbol Keys (Codes.Semicolon -> ";")
                        [ComputerUseTypes_1.Codes.Backquote, "`"],
                        [ComputerUseTypes_1.Codes.Minus, "-"],
                        [ComputerUseTypes_1.Codes.Equal, "="],
                        [ComputerUseTypes_1.Codes.BracketLeft, "["],
                        [ComputerUseTypes_1.Codes.BracketRight, "]"],
                        [ComputerUseTypes_1.Codes.Backslash, "\\"],
                        [ComputerUseTypes_1.Codes.Semicolon, ";"],
                        [ComputerUseTypes_1.Codes.Quote, "'"],
                        [ComputerUseTypes_1.Codes.Comma, ","],
                        [ComputerUseTypes_1.Codes.Period, "."],
                        [ComputerUseTypes_1.Codes.Slash, "/"],
                        // Context Menu Key
                        [ComputerUseTypes_1.Codes.ContextMenu, "{CONTEXT_MENU}"], // Check sendKeys name for this
                    ]);
                    // --- End of Combined Key Mapping ---
                    for (const k of keys) { // k is a string here
                        window.Log(`Action: keypress received '${k}'`);
                        const caseInsensitiveKeyMap = new Map();
                        for (const [key, value] of combinedKeyMap.entries()) {
                            caseInsensitiveKeyMap.set(key.toLowerCase(), value);
                        }
                        // Perform a case-insensitive search
                        const normalizedKey = k.toLowerCase(); // Normalize the key to lowercase
                        if (caseInsensitiveKeyMap.has(normalizedKey)) {
                            // Found a mapping for a special key name or a physical code
                            const keyToSend = caseInsensitiveKeyMap.get(normalizedKey); // Use ! because .has() was true
                            window.Log(` -> Mapping '${k}' (normalized to '${normalizedKey}') to sendKeys string '${keyToSend}'`);
                            window.DoSendKeys(keyToSend);
                        }
                        else {
                            // No mapping found. Assume 'k' is already the literal character/string
                            // to send (e.g., "a", "A", ";", "?", " "). This covers cases where the input
                            // was already a Keys enum value like Keys.a ("a") or Keys.Semicolon (";"),
                            // or potentially an unmapped key name.
                            window.Log(` -> No specific map entry found. Sending literal value '${k}'`);
                            window.DoSendKeys(k);
                        }
                    }
                    break;
                }
                case "type": {
                    const { text } = action;
                    window.Log(`Action: type text '${text}'`);
                    window.DoSendKeys(ComputerUseTypes_1.ComputerUseUtils.escapeSendKeysSpecialChars(text), 10);
                    break;
                }
                case "wait": {
                    window.Log(`Action: wait`);
                    Global.DoSleep(500);
                    break;
                }
                case "screenshot": {
                    window.Log(`Action: screenshot`);
                    break;
                }
                default:
                    window.Log("Unrecognized action:" + action.type);
            }
            window.ActionEnd(actionType, JSON.stringify(action));
        }
        catch (e) {
            window.Log("Error handling action:" + action.type + "/ " + e.message);
            window.ActionEnd(actionType, e.message);
        }
    }
    static toolUseLoop(prompt, window, system_prompt, max_tokens = 10000, n_last_images = 3, timeout = 600000, // Default timeout: 10 minutes
    token_limit = 1000000) {
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
        const fullPrompt = system_prompt ? system_prompt + "\n" + prompt : prompt;
        // Take a screenshot after the action
        const scaledBase64Image = this.getScreenshot(window);
        const payload = {
            input: [
                {
                    role: "user",
                    content: [
                        {
                            type: "input_text",
                            text: fullPrompt,
                        },
                        {
                            type: "input_image",
                            image_url: `data:image/png;base64,${scaledBase64Image}`
                        }
                    ],
                },
            ],
            reasoning: {
                summary: "concise",
            },
            truncation: "auto",
        };
        const response = this.queryLlm(payload, chatStatus);
        // Send the screenshot back as a computer_call_output
        this.computerUseLoop(window, payload, response, chatStatus, timeout, token_limit);
        return chatStatus;
    }
}
exports.ComputerUseOpenAi = ComputerUseOpenAi;
//# sourceMappingURL=ComputerUseOpenAi.js.map