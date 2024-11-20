"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputerUseImpl = void 0;
const sharp_1 = __importDefault(require("sharp"));
class ToolResult {
    constructor(init) {
        this.output = null;
        this.error = null;
        this.base64_image = null;
        this.system = null;
        Object.assign(this, init);
    }
    /**
     * Determines if any field in the result contains data.
     */
    isNonEmpty() {
        return Boolean(this.output || this.error || this.base64_image || this.system);
    }
    /**
     * Combines two `ToolResult` instances, joining text fields with `\n` when both are present.
     * @param other The other `ToolResult` instance to combine.
     */
    add(other) {
        const combineFields = (field1, field2) => {
            if (field1 && field2) {
                return `${field1}\n${field2}`; // Combine fields with \n
            }
            return field1 || field2 || null;
        };
        return new ToolResult({
            output: combineFields(this.output, other.output),
            error: combineFields(this.error, other.error),
            base64_image: this.base64_image || other.base64_image,
            system: combineFields(this.system, other.system),
        });
    }
    /**
     * Creates a new `ToolResult` with specified field replacements.
     * @param changes Fields to replace in the new `ToolResult`.
     * @returns A new `ToolResult` with updated fields.
     */
    replace(changes) {
        return new ToolResult(Object.assign(Object.assign({}, this), changes));
    }
}
class ComputerUseImpl {
    static getBestTarget(width, height) {
        for (const target of Object.values(this.MAX_SCALING_TARGETS)) {
            if (width <= target.width && height <= target.height) {
                return { target, scale_factor: 1 }; // No scaling needed
            }
        }
        return Object.values(this.MAX_SCALING_TARGETS).reduce((bestFit, target) => {
            const widthRatio = target.width / width;
            const heightRatio = target.height / height;
            const scaleFactor = Math.min(widthRatio, heightRatio);
            if (!bestFit || scaleFactor > bestFit.scale_factor) {
                return { target, scale_factor: scaleFactor };
            }
            return bestFit;
        }, null);
    }
    static async processImage(buffer) {
        const img = (0, sharp_1.default)(buffer);
        const metadata = await img.metadata();
        if (!metadata.width || !metadata.height) {
            throw new Error("Image metadata is missing width or height.");
        }
        const { target, scale_factor } = this.getBestTarget(metadata.width, metadata.height);
        let img_scaled = img;
        const metadata_scaled = Object.assign({}, metadata);
        if (scale_factor < 1) {
            metadata_scaled.width = Math.round(metadata.width * scale_factor);
            metadata_scaled.height = Math.round(metadata.height * scale_factor);
            img_scaled = img.resize({
                width: metadata_scaled.width,
                height: metadata_scaled.height,
            });
        }
        return { img, img_scaled, scale_factor, metadata, metadata_scaled };
    }
    static applyScaling(coordinate, scaleFactor) {
        const physicalX = Math.round(coordinate[0] / scaleFactor);
        const physicalY = Math.round(coordinate[1] / scaleFactor);
        return [physicalX, physicalY];
    }
    static convertToSendKeys(xdtoolKey) {
        const keyMap = {
            "return": "{ENTER}",
            "backspace": "{BACKSPACE}",
            "tab": "{TAB}",
            "escape": "{ESC}",
            "space": " ",
            "up": "{UP}",
            "down": "{DOWN}",
            "left": "{LEFT}",
            "right": "{RIGHT}",
            "home": "{HOME}",
            "end": "{END}",
            "page_up": "{PGUP}",
            "page_down": "{PGDN}",
            "insert": "{INS}",
            "delete": "{DEL}",
            "f1": "{F1}", "f2": "{F2}", "f3": "{F3}", "f4": "{F4}",
            "f5": "{F5}", "f6": "{F6}", "f7": "{F7}", "f8": "{F8}",
            "f9": "{F9}", "f10": "{F10}", "f11": "{F11}", "f12": "{F12}",
        };
        // Split the input into key combinations separated by spaces
        const combinations = xdtoolKey.split(" ");
        const convertedCombinations = [];
        for (const combo of combinations) {
            // Split individual combination into modifiers and main keys (separated by '+')
            const parts = combo.toLowerCase().split("+");
            const modifiers = [];
            const keys = [];
            for (const part of parts) {
                if (["ctrl", "alt", "shift"].includes(part)) {
                    modifiers.push(part); // Collect modifiers
                }
                else {
                    keys.push(part); // Collect the main key(s)
                }
            }
            // Map keys and wrap with braces if not already wrapped
            const mappedKeys = keys
                .map((key) => keyMap[key] || `{${key.toUpperCase()}}`) // Map or use {key}
                .join(""); // Join if multiple keys are provided
            // Apply modifiers
            let sendKey = mappedKeys;
            for (const mod of modifiers) {
                if (mod === "ctrl")
                    sendKey = `^${sendKey}`;
                if (mod === "alt")
                    sendKey = `%${sendKey}`;
                if (mod === "shift")
                    sendKey = `+${sendKey}`;
            }
            convertedCombinations.push(sendKey);
        }
        // Join individual key combinations with a space
        return convertedCombinations.join(" ");
    }
    static async processToolUseAction(action, window, scaleFactor) {
        var _a;
        const result = new ToolResult({});
        const actionKey = `${action.action}-${Date.now()}`;
        try {
            window.ActionStart(actionKey, `Starting action: ${action.action}`);
            switch (action.action) {
                case "mouse_move":
                    if (!action.coordinate) {
                        throw new Error("coordinate is required for mouse_move actions");
                    }
                    const [moveX, moveY] = this.applyScaling(action.coordinate, scaleFactor);
                    window.Log(`Processing mouse_move to: (${moveX}, ${moveY})`);
                    window.DoMouseMove(moveX, moveY);
                    result.output = `Mouse moved to (${moveX}, ${moveY})`;
                    break;
                case "left_click_drag":
                    if (!action.coordinate) {
                        throw new Error("coordinate is required for left_click_drag actions");
                    }
                    const [dragX, dragY] = this.applyScaling(action.coordinate, scaleFactor);
                    window.Log(`Processing left_click_drag to: (${dragX}, ${dragY})`);
                    window.DoMouseDragTo(dragX, dragY);
                    result.output = `Dragged mouse to (${dragX}, ${dragY})`;
                    break;
                case "left_click":
                    window.Log("Performing left click");
                    window.DoClick("L");
                    result.output = "Performed left click";
                    break;
                case "right_click":
                    window.Log("Performing right click");
                    window.DoClick("R");
                    result.output = "Performed right click";
                    break;
                case "middle_click":
                    window.Log("Performing middle click");
                    window.DoClick("M");
                    result.output = "Performed middle click";
                    break;
                case "double_click":
                    window.Log("Performing double click");
                    window.DoClick("LD");
                    result.output = "Performed double click";
                    break;
                case "key":
                    if (!action.text) {
                        throw new Error("text is required for key actions");
                    }
                    const sendKeys = this.convertToSendKeys(action.text);
                    window.Log(`Sending keys: ${sendKeys}`);
                    window.DoSendKeys(sendKeys);
                    result.output = `Sent keys: ${sendKeys}`;
                    break;
                case "type":
                    if (!action.text) {
                        throw new Error("text is required for type actions");
                    }
                    window.Log(`Typing text: ${action.text}`);
                    window.DoSendKeys(action.text); // Sends text directly without key conversion
                    result.output = `Typed text: ${action.text}`;
                    break;
                case "screenshot":
                    window.Log("Taking screenshot");
                    result.base64_image = window.GetScreenshot();
                    result.output = "Screenshot taken";
                    break;
                case "cursor_position":
                    window.Log("Fetching cursor position");
                    const cursorPosition = window.GetCursorPosition();
                    result.output = `Cursor position: (${cursorPosition.x}, ${cursorPosition.y})`;
                    break;
                default:
                    throw new Error(`Invalid action: ${action.action}`);
            }
        }
        catch (error) {
            result.error = `Failed to perform action ${action.action}: ${error.message}`;
        }
        finally {
            window.ActionEnd(actionKey, (_a = result.output) !== null && _a !== void 0 ? _a : result.error);
        }
        return result;
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
        var _a;
        return (typeof response === "object" &&
            response !== null &&
            response.name === "ValidationException" &&
            response.$fault === "client" &&
            ((_a = response.$metadata) === null || _a === void 0 ? void 0 : _a.httpStatusCode) === 400);
    }
    static async processResponse(payload, imgMeta, response, chatStatus, window) {
        var _a, _b, _c;
        window.Log(`Processing response: ${JSON.stringify(response, null, 2)}`);
        chatStatus.input_tokens += response.usage.input_tokens;
        chatStatus.output_tokens += response.usage.output_tokens;
        chatStatus.stop_reason = response.stop_reason;
        let cumulativeResult = new ToolResult({});
        const scaleFactor = imgMeta.scale_factor;
        for (const contentItem of response.content) {
            if (contentItem.type === "text") {
                // Handle text blocks as needed
                continue;
            }
            else if (contentItem.type === "tool_use") {
                chatStatus.tool_invocations++; // Increment tool invocation count
                const action = {
                    action: (_a = contentItem.input) === null || _a === void 0 ? void 0 : _a.action,
                    text: (_b = contentItem.input) === null || _b === void 0 ? void 0 : _b.text,
                    coordinate: (_c = contentItem.input) === null || _c === void 0 ? void 0 : _c.coordinate,
                };
                const actionKey = `${action.action}-${Date.now()}`;
                window.ActionStart(actionKey, action.action); // Pass only the action text into ActionStart
                try {
                    const result = await this.processToolUseAction(action, window, scaleFactor);
                    cumulativeResult = cumulativeResult.add(result);
                    const toolResultPayload = this.makeToolResultPayload(result, contentItem.id);
                    payload.messages.push({
                        role: "user",
                        content: [toolResultPayload],
                    });
                }
                catch (error) {
                    // Call ActionEnd only if an exception occurs
                    window.ActionEnd(actionKey, `Error: ${error.message}`);
                    throw error; // Rethrow the error to propagate it
                }
            }
        }
        if (cumulativeResult.isNonEmpty()) {
            window.Log(`Tool execution result: ${JSON.stringify(cumulativeResult, null, 2)}`);
        }
        return response.stop_reason === "tool_use";
    }
    static async toolUseLoop(prompt, window, last, max_tokens = 10000, n_last_images = 3, timeout = 300000, // Default timeout: 5 minutes
    token_limit = 1000000 // Default token limit: 1 million
    ) {
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
        if (!shouldIgnoreLast && (last === null || last === void 0 ? void 0 : last.payload)) {
            payload = last.payload;
            imgMeta = last.imgMeta;
            window.Log("Using last payload and image metadata for the chat session.");
        }
        else {
            const base64Image = window.GetScreenshot();
            const imageBuffer = Buffer.from(base64Image, "base64");
            imgMeta = await this.processImage(imageBuffer);
            const scaledImageBuffer = await imgMeta.img_scaled.toBuffer();
            const scaledBase64Image = scaledImageBuffer.toString("base64");
            payload = {
                anthropic_version: "bedrock-2023-05-31",
                max_tokens,
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
                        type: "computer_20241022",
                        name: "computer",
                        display_height_px: imgMeta.metadata_scaled.height,
                        display_width_px: imgMeta.metadata_scaled.width,
                        display_number: 0,
                    },
                ],
                anthropic_beta: ["computer-use-2024-10-22"],
            };
            window.Log("Created a new payload for the chat session.");
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
            while (retries < 3) {
                try {
                    if (!response) {
                        response = AiServerClient.QueryRaw(payload, { defaultModelApiType: "bedrock" });
                        window.Log("Fetched a new response from the server.");
                        chatStatus.prompt_queries++; // Increment prompt query count
                    }
                    // Check if the response indicates a ValidationException
                    if (response && this.isValidationException(response)) {
                        retries++;
                        window.Log(`Retry ${retries}: ValidationException detected in response.`);
                        response = undefined; // Clear response to retry
                        if (retries >= 3) {
                            throw new Error("Exceeded maximum retries due to ValidationException.");
                        }
                        continue; // Retry logic
                    }
                    break; // Exit retry loop if no ValidationException
                }
                catch (error) {
                    throw new Error(`Failed after ${retries} retries: ${error.message}`);
                }
            }
            // Register the payload, response, image metadata, and chatStatus
            window.RegisterResponse(payload, response, imgMeta, chatStatus);
            // Filter out older images if n_last_images is specified
            this.filterRecentImages(payload.messages, n_last_images);
            // Add the assistant's response to the payload before processing
            payload.messages.push({
                role: "assistant",
                content: response.content,
            });
            // Process the response and determine if the loop should continue
            const shouldContinue = await this.processResponse(payload, imgMeta, response, chatStatus, window);
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
        window.Log(`Final response: ${JSON.stringify(response, null, 2)}`);
        return chatStatus; // Return the updated chatStatus
    }
}
exports.ComputerUseImpl = ComputerUseImpl;
ComputerUseImpl.MAX_SCALING_TARGETS = {
    XGA: { width: 1024, height: 768 },
    WXGA: { width: 1280, height: 800 },
    FWXGA: { width: 1366, height: 768 }, // ~16:9
};
//# sourceMappingURL=ComputerUseImpl.js.map