"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputerUseAnthropic = exports.versionConfig37 = exports.versionConfig35 = void 0;
const ComputerUseTypes_1 = require("./ComputerUseTypes"); // Assuming you have a separate file for types
const deasync_1 = __importDefault(require("deasync"));
exports.versionConfig35 = {
    anthropic_version: "bedrock-2023-05-31",
    tools_computer: "computer_20241022",
    anthropic_beta: "computer-use-2024-10-22",
    version: "3.5"
};
exports.versionConfig37 = {
    anthropic_version: "bedrock-2023-05-31",
    tools_computer: "computer_20250124",
    anthropic_beta: "computer-use-2025-01-24",
    version: "3.7"
};
class ComputerUseAnthropic {
    static processToolUseAction(action, window, scaleFactor) {
        try {
            switch (action.action) {
                // Mouse actions
                case "mouse_move":
                    if (!action.coordinate) {
                        throw new Error("Coordinate is required for mouse_move action.");
                    }
                    const [moveX, moveY] = ComputerUseTypes_1.ComputerUseUtils.applyScaling(action.coordinate, scaleFactor);
                    window.Log(`Moving mouse to (${moveX}, ${moveY})`);
                    window.DoMouseMove(moveX, moveY);
                    return new ComputerUseTypes_1.ToolResult({ output: `Mouse moved to (${moveX}, ${moveY})` });
                case "left_click":
                    if (action.coordinate) {
                        const [clickX, clickY] = ComputerUseTypes_1.ComputerUseUtils.applyScaling(action.coordinate, scaleFactor);
                        window.Log(`Performing left click at (${clickX}, ${clickY})`);
                        window.DoMouseMove(clickX, clickY);
                        window.DoClick("L");
                        return new ComputerUseTypes_1.ToolResult({ output: `Left click performed at (${clickX}, ${clickY})` });
                    }
                    else {
                        window.Log("Performing left click.");
                        window.DoClick("L");
                        return new ComputerUseTypes_1.ToolResult({ output: "Left click performed." });
                    }
                case "left_click_drag":
                    if (!action.coordinate) {
                        throw new Error("Coordinate is required for left_click_drag action.");
                    }
                    const [dragX, dragY] = ComputerUseTypes_1.ComputerUseUtils.applyScaling(action.coordinate, scaleFactor);
                    window.Log(`Dragging mouse to (${dragX}, ${dragY})`);
                    window.DoMouseDragTo(dragX, dragY);
                    return new ComputerUseTypes_1.ToolResult({ output: `Mouse dragged to (${dragX}, ${dragY})` });
                case "right_click":
                    window.Log("Performing right click.");
                    window.DoClick("R");
                    return new ComputerUseTypes_1.ToolResult({ output: "Right click performed." });
                case "middle_click":
                    window.Log("Performing middle click.");
                    window.DoClick("M");
                    return new ComputerUseTypes_1.ToolResult({ output: "Middle click performed." });
                case "double_click":
                    window.Log("Performing double click.");
                    window.DoClick("LD");
                    return new ComputerUseTypes_1.ToolResult({ output: "Double click performed." });
                case "triple_click":
                    window.Log("Performing triple click.");
                    window.DoClick("LD");
                    window.DoClick("L");
                    return new ComputerUseTypes_1.ToolResult({ output: "Triple click performed." });
                // Keyboard actions
                case "key":
                    if (!action.text) {
                        throw new Error("Key text is required for key action.");
                    }
                    const sendKey = ComputerUseTypes_1.ComputerUseUtils.convertToSendKeys(action.text);
                    window.Log(`Sending key: "${action.text}"`);
                    window.DoSendKeys(sendKey);
                    return new ComputerUseTypes_1.ToolResult({ output: `Key "${action.text}" sent.` });
                case "type":
                    if (!action.text) {
                        throw new Error("Text is required for type action.");
                    }
                    const escapedText = ComputerUseTypes_1.ComputerUseUtils.escapeSendKeysSpecialChars(action.text);
                    window.Log(`Typing text: "${action.text}"`);
                    window.DoSendKeys(escapedText);
                    return new ComputerUseTypes_1.ToolResult({ output: `Typed text: "${action.text}".` });
                // Utility actions
                case "cursor_position":
                    window.Log("Getting cursor position.");
                    const cursorPosition = window.GetCursorPosition();
                    return new ComputerUseTypes_1.ToolResult({ output: `Cursor is at position (${cursorPosition.x}, ${cursorPosition.y}).` });
                case "screenshot":
                    window.Log("Capturing screenshot.");
                    const screenshotBase64 = window.GetScreenshot();
                    return new ComputerUseTypes_1.ToolResult({
                        output: "Screenshot captured.",
                        base64_image: screenshotBase64,
                    });
                case "wait":
                    const duration = action.duration;
                    Global.DoSleep(1000 * duration);
                    const screenshotAfterWaitBase64 = window.GetScreenshot();
                    return new ComputerUseTypes_1.ToolResult({
                        output: "Wait done.",
                        base64_image: screenshotAfterWaitBase64,
                    });
                case "hold_key":
                    window.DoSendKeys(ComputerUseTypes_1.ComputerUseUtils.convertToSendKeys(action.text), action.duration);
                    return new ComputerUseTypes_1.ToolResult({
                        output: "Key pressed."
                    });
                case "scroll":
                    let scrollX = 0;
                    let scrollY = 0;
                    switch (action.scroll_direction) {
                        case "down":
                            scrollY = -action.scroll_amount;
                            break;
                        case "up":
                            scrollY = action.scroll_amount;
                            break;
                        case "left":
                            scrollX = -action.scroll_amount;
                            break;
                        case "right":
                            scrollX = action.scroll_amount;
                            break;
                    }
                    if (action.coordinate) {
                        const [clickX, clickY] = ComputerUseTypes_1.ComputerUseUtils.applyScaling(action.coordinate, scaleFactor);
                        window.DoMouseMove(clickX, clickY);
                        window.DoClick("L");
                    }
                    if (action.text) {
                        // TODO: press button before scrolling
                        window.DoScroll(scrollX, scrollY);
                        return new ComputerUseTypes_1.ToolResult({ output: `Scrolled by (${scrollX}, ${scrollY})` });
                    }
                    else {
                        window.DoScroll(scrollX, scrollY);
                        return new ComputerUseTypes_1.ToolResult({ output: `Scrolled by (${scrollX}, ${scrollY})` });
                    }
                    break;
                case "left_mouse_down":
                    window.Log(`Pressing left mouse button`);
                    window.DoMousePress("L");
                    return new ComputerUseTypes_1.ToolResult({ output: `Left mouse button pressed` });
                case "left_mouse_up":
                    window.Log(`Releasing left mouse button`);
                    window.DoMouseRelease("L");
                    return new ComputerUseTypes_1.ToolResult({ output: `Left mouse button released` });
                // Rapise tool actions
                case "rapise_assert":
                    if (typeof action.text !== "string" || typeof action.pass !== "boolean") {
                        throw new Error("Text and pass must be provided for rapise_assert action.");
                    }
                    window.Log(`Performing assertion: "${action.text}", Pass: ${action.pass}`);
                    window.Assert(action.text, action.pass, action.additionalData);
                    return new ComputerUseTypes_1.ToolResult({ output: `Assertion executed: ${action.text}, Pass: ${action.pass}.` });
                case "rapise_set_return_value":
                    if (action.val === undefined) {
                        throw new Error("Value must be provided for rapise_set_return_value action.");
                    }
                    window.Log(`Setting return value to: ${action.val}`);
                    window.SetReturnValue(action.val);
                    return new ComputerUseTypes_1.ToolResult({ output: `Return value set to: ${action.val}` });
                case "rapise_print_message":
                    if (!action.text) {
                        throw new Error("Text must be provided for rapise_print_message action.");
                    }
                    window.PrintReportMessage(action.text);
                    return new ComputerUseTypes_1.ToolResult({ output: `Message logged: "${action.text}".` });
                // Unknown or unsupported action
                default:
                    throw new Error(`Unsupported action: ${action.action}`);
            }
        }
        catch (error) {
            window.Log(`Error occurred during action "${action.action}": ${error.message}`);
            return new ComputerUseTypes_1.ToolResult({ error: error.message });
        }
    }
    static makeToolResultPayload(result, toolUseId) {
        const toolResultContent = [];
        let isError = false;
        if (result.error) {
            isError = true;
            toolResultContent.push({ type: "text", text: `<error>${result.error}</error>` });
        }
        else {
            if (result.output) {
                toolResultContent.push({ type: "text", text: result.output });
            }
            if (result.base64_image) {
                toolResultContent.push({
                    type: "image",
                    source: { type: "base64", media_type: "image/png", data: result.base64_image },
                });
            }
        }
        return {
            type: "tool_result",
            content: toolResultContent,
            tool_use_id: toolUseId,
            is_error: isError,
        };
    }
    static filterRecentImages(messages, n_last_images) {
        const imageMessages = messages.filter((msg) => msg.content.some((contentItem) => contentItem.type === "image"));
        const excessImages = imageMessages.length - n_last_images;
        if (excessImages > 0) {
            for (let i = 0; i < excessImages; i++) {
                const oldestImageIndex = messages.findIndex((msg) => msg.content.some((contentItem) => contentItem.type === "image"));
                if (oldestImageIndex !== -1) {
                    messages.splice(oldestImageIndex, 1); // Remove the oldest image message
                }
            }
        }
    }
    static isValidationException(response) {
        return (response == null ||
            (typeof response === "object" && response.$fault));
    }
    static processResponse(payload, imgMeta, response, chatStatus, window) {
        window.Log(`Processing response: ${JSON.stringify(response, null, 2)}`, 4);
        chatStatus.input_tokens += response.usage.input_tokens;
        chatStatus.output_tokens += response.usage.output_tokens;
        chatStatus.stop_reason = response.stop_reason;
        let cumulativeResult = new ComputerUseTypes_1.ToolResult({});
        const toolResultsPayload = [];
        const scaleFactor = imgMeta.scale_factor;
        for (const contentItem of response.content) {
            if (contentItem.type === "text") {
                if (contentItem.text) {
                    window.AssistantText(contentItem.text);
                }
                continue;
            }
            else if (contentItem.type === "tool_use") {
                chatStatus.tool_invocations++;
                const toolName = contentItem.name; // Identify the tool name
                const actionInput = contentItem.input;
                const actionId = contentItem.id;
                const actionKey = `${toolName}-${actionId}`;
                window.ActionStart(actionKey, `Executing action: ${toolName}`);
                try {
                    // Construct the ToolUseAction based on the tool name
                    let action;
                    switch (toolName) {
                        case "rapise_assert":
                        case "rapise_set_return_value":
                        case "rapise_print_message":
                            action = {
                                action: toolName,
                                text: actionInput.text,
                                pass: actionInput.pass,
                                val: actionInput.val,
                                additionalData: actionInput.additionalData,
                            };
                            break;
                        case "computer":
                            action = {
                                action: actionInput.action,
                                text: actionInput.text,
                                coordinate: actionInput.coordinate,
                            };
                            break;
                        default:
                            throw new Error(`Unsupported tool name: ${toolName}`);
                    }
                    const result = this.processToolUseAction(action, window, scaleFactor);
                    cumulativeResult = cumulativeResult.add(result);
                    // Prepare the tool result payload
                    toolResultsPayload.push(this.makeToolResultPayload(result, contentItem.id));
                }
                catch (error) {
                    window.ActionEnd(actionKey, `Error: ${error.message}`);
                    // Prepare the error result payload
                    const errorResult = new ComputerUseTypes_1.ToolResult({ error: error.message });
                    toolResultsPayload.push(this.makeToolResultPayload(errorResult, contentItem.id));
                    // Optionally, you might want to rethrow the error or handle it accordingly
                }
            }
        }
        if (cumulativeResult.isNonEmpty()) {
            const { base64_image, output, error, system } = cumulativeResult;
            window.Log(`Tool execution result: ${JSON.stringify({ output, error, system }, null, 2)}`, 4);
            payload.messages.push({
                role: "user",
                content: toolResultsPayload,
            });
        }
        return response.stop_reason === "tool_use";
    }
    static toolUseLoop(prompt, window, system_prompt, max_tokens = 10000, n_last_images = 3, timeout = 600000, // Default timeout: 10 minutes
    token_limit = 1000000, // Default token limit: 1 million
    versionConfig = exports.versionConfig35, last) {
        var _a;
        const shouldIgnoreLast = ((_a = last === null || last === void 0 ? void 0 : last.chatStatus) === null || _a === void 0 ? void 0 : _a.stop_reason) !== "tool_use";
        const chatStatus = !shouldIgnoreLast && (last === null || last === void 0 ? void 0 : last.chatStatus)
            ? last.chatStatus
            : {
                start: new Date(),
                prompt,
                input_tokens: 0,
                output_tokens: 0,
                stop_reason: "",
                success: false,
                tool_invocations: 0,
                prompt_queries: 0,
            };
        let payload;
        let imgMeta;
        window.Log(prompt);
        if (!shouldIgnoreLast && (last === null || last === void 0 ? void 0 : last.payload)) {
            payload = last.payload;
            imgMeta = last.imgMeta;
            window.Log("Using last payload and image metadata for the chat session.");
        }
        else {
            const base64Image = window.GetScreenshot();
            const imageBuffer = Buffer.from(base64Image, "base64");
            imgMeta = ComputerUseTypes_1.ComputerUseUtils.processImage(imageBuffer);
            // Wrap the async toBuffer call in deasync to make it synchronous
            let scaledImageBuffer = undefined;
            imgMeta.img_scaled.toBuffer().then(buf => { scaledImageBuffer = buf; }).catch(err => {
                window.Log("Error scaling image: " + err.message);
                scaledImageBuffer = Buffer.from(""); // Return empty buffer on error
            });
            while (scaledImageBuffer === undefined) {
                deasync_1.default.runLoopOnce();
            }
            const scaledBase64Image = scaledImageBuffer.toString("base64");
            payload = {
                anthropic_version: versionConfig.anthropic_version,
                max_tokens,
                system: system_prompt,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            {
                                type: "image",
                                source: { type: "base64", media_type: "image/png", data: scaledBase64Image },
                            },
                        ],
                    },
                ],
                tools: [
                    {
                        type: versionConfig.tools_computer,
                        name: "computer",
                        display_height_px: imgMeta.metadata_scaled.height,
                        display_width_px: imgMeta.metadata_scaled.width,
                        display_number: 0,
                    },
                    {
                        name: "rapise_assert",
                        description: "Perform an assertion during the automation process. Only do this when user asks to check or validate something explicitly.",
                        input_schema: {
                            type: "object",
                            properties: {
                                text: { type: "string", description: "The assertion message or condition" },
                                pass: { type: "boolean", description: "Whether the assertion passed or failed" },
                                additionalData: {
                                    type: "string",
                                    description: "Optional additional context for the assertion",
                                    nullable: true,
                                },
                            },
                            required: ["text", "pass"],
                        },
                    },
                    {
                        name: "rapise_set_return_value",
                        description: "Set a return value for later use. Do this when user asks to store a value for later use or to capture some value.",
                        input_schema: {
                            type: "object",
                            properties: {
                                val: { type: ["string", "number", "boolean"], description: "The value to set" },
                            },
                            required: ["val"],
                        },
                    },
                    {
                        name: "rapise_print_message",
                        description: "Log a message during the automation process. Do this when user explicitly asks to output or print something (print to report, show in the report etc)",
                        input_schema: {
                            type: "object",
                            properties: {
                                text: { type: "string", description: "The message to log" },
                            },
                            required: ["text"],
                        },
                    },
                ],
                anthropic_beta: [versionConfig.anthropic_beta],
            };
        }
        const startTime = Date.now();
        let response = !shouldIgnoreLast ? last === null || last === void 0 ? void 0 : last.response : undefined;
        do {
            if (Date.now() - startTime >= timeout) {
                chatStatus.stop_reason = "timeout";
                chatStatus.success = false;
                window.Log("Chat session timed out.");
                break;
            }
            if (chatStatus.input_tokens + chatStatus.output_tokens >= token_limit) {
                chatStatus.stop_reason = "token_limit";
                chatStatus.success = false;
                window.Log("Token limit reached for the chat session.");
                break;
            }
            let retries = 0;
            let delay = 1000;
            while (retries < 10) {
                try {
                    if (!response || this.isValidationException(response)) {
                        response = AiServerClient.QueryRaw(payload, { defaultModelApiType: "bedrock" });
                        chatStatus.prompt_queries++; // Increment prompt query count
                    }
                    // Register the payload, response, image metadata, and chatStatus
                    window.RegisterResponse(payload, response, imgMeta, chatStatus);
                    // Check if the response indicates a ValidationException
                    if (response && this.isValidationException(response)) {
                        retries++;
                        window.Log(`Retry ${retries}: ValidationException detected in response.`);
                        Global.DoSleep(delay); // Delay for 1 second
                        response = undefined; // Clear response to retry
                        if (retries >= 3) {
                            throw new Error("Exceeded maximum retries due to ValidationException.");
                        }
                        delay = delay * 3;
                        continue; // Retry logic
                    }
                    break; // Exit retry loop if no ValidationException
                }
                catch (error) {
                    throw new Error(`Failed after ${retries} retries: ${error.message}`);
                }
            }
            // Filter out older images if n_last_images is specified
            this.filterRecentImages(payload.messages, n_last_images);
            // Add the assistant's response to the payload before processing
            payload.messages.push({
                role: "assistant",
                content: response.content,
            });
            // Process the response and determine if the loop should continue
            const shouldContinue = this.processResponse(payload, imgMeta, response, chatStatus, window);
            if (!shouldContinue)
                break;
            response = undefined; // Clear response to fetch a new one in the next iteration
        } while (true);
        // Finalize `end` and `duration`
        chatStatus.end = new Date();
        chatStatus.duration = chatStatus.end.getTime() - chatStatus.start.getTime();
        // Register the final state after exiting the loop
        window.RegisterResponse(payload, response, imgMeta, chatStatus);
        // Update success based on the final stop reason
        chatStatus.success = chatStatus.stop_reason === "end_turn";
        window.Log(`Final response: ${JSON.stringify(response, null, 2)}`, 4);
        return chatStatus; // Return the updated chatStatus
    }
}
exports.ComputerUseAnthropic = ComputerUseAnthropic;
//# sourceMappingURL=ComputerUseAnthropic.js.map