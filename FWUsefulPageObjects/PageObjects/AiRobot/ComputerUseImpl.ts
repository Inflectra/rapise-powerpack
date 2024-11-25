import sharp from 'sharp';

// Interfaces for external objects
interface Tester {
  Assert(description: string, condition: boolean, attachments: any[]): void;
  Message(message: string): void;
}


declare var Global: {
  DoSleep: (milliseconds: number) => void;
};

interface AiServerClient {
  QueryRaw(payload: any, options: any): any;
}

interface WebDriver {
  GetScreenshotIW(): Screenshot;
}

interface Screenshot {
  ToBase64Bitmap(): string;
}

interface SeSReportImage {
  new (image: Screenshot): SeSReportImage;
}

// Declare external objects
declare var Tester: Tester;
declare var AiServerClient: AiServerClient;
declare var WebDriver: WebDriver;
declare var SeSReportImage: SeSReportImage;

// Interfaces for image processing
interface Dimensions {
  width: number;
  height: number;
}

interface ScalingTarget {
  target: Dimensions;
  scale_factor: number;
}

interface ProcessImageResult {
  img: sharp.Sharp; // The original Sharp image object
  img_scaled: sharp.Sharp; // The scaled Sharp image object
  scale_factor: number; // The scaling factor used for resizing
  metadata: sharp.Metadata; // Metadata of the original image
  metadata_scaled: sharp.Metadata; // Metadata of the scaled image
}

type AnthropicPayload = {
  anthropic_version: string;
  max_tokens: number;
  messages: Array<{
    role: "user" | "assistant";
    content: Array<
      | {
          type: "text";
          text: string;
        }
      | {
          type: "image";
          source: {
            type: "base64";
            media_type: string;
            data: string;
          };
        }
      | {
          type: "tool_use";
          name: string; // Generic name for tools
          input: {
            action: Action; // Refers to the Action type
            text?: string; // Optional message or logging text
            pass?: boolean; // Used with "rapise_assert"
            val?: string | number | boolean; // Used with "rapise_set_return_value"
            additionalData?: string; // Optional additional data for assertions
            coordinate?: [number, number]; // Optional coordinates for mouse actions
          };
        }
    >;
  }>;
  tools: Array<any>; // Generic type for tools
  anthropic_beta: string[];
};


type AnthropicResponseContent =
  | {
      type: "text";
      text: string; // Assistant's textual response
    }
  | {
      type: "image";
      source: {
        type: "base64";
        media_type: string; // Media type (e.g., "image/png")
        data: string; // Base64-encoded image
      };
    }
  | {
      type: "tool_use";
      name: string; // Tool name (e.g., "computer", "rapise_assert", etc.)
      input: {
        action: Action; // Refers to the Action type
        text?: string; // Optional text for actions like "type", "key", or logging
        pass?: boolean; // For "rapise_assert"
        val?: string | number | boolean; // For "rapise_set_return_value"
        additionalData?: string; // Optional additional context for assertions
        coordinate?: [number, number]; // Coordinates for mouse actions
      };
      id: string; // Unique identifier for the tool invocation
    };


interface AnthropicResponseUsage {
  input_tokens: number;
  output_tokens: number;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  model: string;
  content: AnthropicResponseContent[];
  stop_reason: string;
  stop_sequence: string | null;
  usage: AnthropicResponseUsage;
}

type Action =
  | "rapise_assert"
  | "rapise_set_return_value"
  | "rapise_print_message"
  | "key"
  | "type"
  | "mouse_move"
  | "left_click"
  | "left_click_drag"
  | "right_click"
  | "middle_click"
  | "double_click"
  | "screenshot"
  | "cursor_position";

  type ToolUseAction = {
    action: Action; // Use the Action type here
    text?: string; // Optional text for typing, logging, or assertions
    coordinate?: [number, number]; // Optional coordinates for mouse-related actions
    pass?: boolean; // Optional boolean for assertion success/failure
    val?: string | number | boolean; // Optional value for setting return values
    additionalData?: string; // Optional additional context for assertions
  };
  

class ToolResult {
  output: string | null = null;
  error: string | null = null;
  base64_image: string | null = null;
  system: string | null = null;

  constructor(init?: Partial<ToolResult>) {
    Object.assign(this, init);
  }

  /**
   * Determines if any field in the result contains data.
   */
  isNonEmpty(): boolean {
    return Boolean(this.output || this.error || this.base64_image || this.system);
  }

  /**
   * Combines two `ToolResult` instances, joining text fields with `\n` when both are present.
   * @param other The other `ToolResult` instance to combine.
   */
  add(other: ToolResult): ToolResult {
    const combineFields = (field1: string | null, field2: string | null): string | null => {
      if (field1 && field2) {
        return `${field1}\n${field2}`; // Combine fields with \n
      }
      return field1 || field2 || null;
    };

    return new ToolResult({
      output: combineFields(this.output, other.output),
      error: combineFields(this.error, other.error),
      base64_image: this.base64_image || other.base64_image, // Keep only the first non-null image
      system: combineFields(this.system, other.system),
    });
  }

  /**
   * Creates a new `ToolResult` with specified field replacements.
   * @param changes Fields to replace in the new `ToolResult`.
   * @returns A new `ToolResult` with updated fields.
   */
  replace(changes: Partial<ToolResult>): ToolResult {
    return new ToolResult({ ...this, ...changes });
  }
}

interface TargetWindow {
  // Mouse Actions
  DoMouseMove(x: number, y: number): void; // Move the mouse to a specific coordinate
  DoClick(clickType: "L" | "R" | "M" | "LD"): void; // Perform left, right, middle, or double click
  DoMouseDragTo(x: number, y: number): void; // Drag the mouse to a specific coordinate

  // Keyboard Actions
  DoSendKeys(keys: string): void; // Simulate typing or key presses

  // Screen-Related Actions
  GetScreenshot(): string; // Capture and return a Base64-encoded screenshot
  GetCursorPosition(): { x: number; y: number }; // Retrieve the current cursor position

  // Logging and Reporting
  Log(message: string): void; // Log a general-purpose message
  PrintReportMessage(message: string): void; // Log a report-specific message for rapise_print_message
  AssistantText(message: string): void; // Display assistant messages or instructions

  // Assertions
  Assert(message: string, pass: boolean, additionalData?: string): void; // Perform an assertion

  // Return Values
  SetReturnValue(val: string | number | boolean): void; // Set a return value for later use
  GetReturnValue(): string | number | boolean; // Retrieve the previously set return value

  // Response Registration
  RegisterResponse(
    payload: any,
    response: any,
    chatStatus: any,
    imgMeta: any
  ): void; // Register the payload, response, status, and image metadata

  // Action Tracking
  ActionStart(actionKey: string, message: string): void; // Log the start of an action with a key and message
  ActionEnd(actionKey: string, output: string): void; // Log the end of an action with its key and result
}

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

export class ComputerUseImpl {
  private static MAX_SCALING_TARGETS: Record<string, Dimensions> = {
    XGA: { width: 1024, height: 768 }, // 4:3
    WXGA: { width: 1280, height: 800 }, // 16:10
    FWXGA: { width: 1366, height: 768 }, // ~16:9
  };

  private static getBestTarget(width: number, height: number): ScalingTarget {
    for (const target of Object.values(this.MAX_SCALING_TARGETS)) {
      if (width <= target.width && height <= target.height) {
        return { target, scale_factor: 1 }; // No scaling needed
      }
    }

    return Object.values(this.MAX_SCALING_TARGETS).reduce<ScalingTarget | null>(
      (bestFit, target) => {
        const widthRatio = target.width / width;
        const heightRatio = target.height / height;
        const scaleFactor = Math.min(widthRatio, heightRatio);

        if (!bestFit || scaleFactor > bestFit.scale_factor) {
          return { target, scale_factor: scaleFactor };
        }
        return bestFit;
      },
      null
    ) as ScalingTarget;
  }

  private static async processImage(buffer: Buffer): Promise<ProcessImageResult> {
    const img = sharp(buffer);
    const metadata = await img.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("Image metadata is missing width or height.");
    }

    const { target, scale_factor } = this.getBestTarget(metadata.width, metadata.height);

    let img_scaled = img;
    const metadata_scaled: sharp.Metadata = { ...metadata };

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

  private static applyScaling(coordinate: [number, number], scaleFactor: number): [number, number] {
    const physicalX = Math.round(coordinate[0] / scaleFactor);
    const physicalY = Math.round(coordinate[1] / scaleFactor);
    return [physicalX, physicalY];
  }

  private static convertToSendKeys(xdtoolKey: string): string {
    const keyMap: { [key: string]: string } = {
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
    const convertedCombinations: string[] = [];
  
    for (const combo of combinations) {
      // Split individual combination into modifiers and main keys (separated by '+')
      const parts = combo.toLowerCase().split("+");
      const modifiers: string[] = [];
      const keys: string[] = [];
  
      for (const part of parts) {
        if (["ctrl", "alt", "shift"].includes(part)) {
          modifiers.push(part); // Collect modifiers
        } else {
          keys.push(part); // Collect the main key(s)
        }
      }
  
      // Map keys and wrap with braces if not already wrapped
      const mappedKeys = keys
        .map((key) => keyMap[key] || `{${key}}`) // Map or use {key} in lowercase
        .join(""); // Join if multiple keys are provided
  
      // Apply modifiers
      let sendKey = mappedKeys;
      for (const mod of modifiers) {
        if (mod === "ctrl") sendKey = `^${sendKey}`;
        if (mod === "alt") sendKey = `%${sendKey}`;
        if (mod === "shift") sendKey = `+${sendKey}`;
      }
  
      convertedCombinations.push(sendKey);
    }
  
    // Join individual key combinations with a space
    return convertedCombinations.join(" ");
  }
  
  
  private static async processToolUseAction(
    action: ToolUseAction,
    window: TargetWindow,
    scaleFactor: number
  ): Promise<ToolResult> {
    try {
      switch (action.action) {
        // Mouse actions
        case "mouse_move":
          if (!action.coordinate) {
            throw new Error("Coordinate is required for mouse_move action.");
          }
          const [moveX, moveY] = this.applyScaling(action.coordinate, scaleFactor);
          window.Log(`Moving mouse to (${moveX}, ${moveY})`);
          window.DoMouseMove(moveX, moveY);
          return new ToolResult({ output: `Mouse moved to (${moveX}, ${moveY})` });
  
        case "left_click":
          window.Log("Performing left click.");
          window.DoClick("L");
          return new ToolResult({ output: "Left click performed." });
  
        case "left_click_drag":
          if (!action.coordinate) {
            throw new Error("Coordinate is required for left_click_drag action.");
          }
          const [dragX, dragY] = this.applyScaling(action.coordinate, scaleFactor);
          window.Log(`Dragging mouse to (${dragX}, ${dragY})`);
          window.DoMouseDragTo(dragX, dragY);
          return new ToolResult({ output: `Mouse dragged to (${dragX}, ${dragY})` });
  
        case "right_click":
          window.Log("Performing right click.");
          window.DoClick("R");
          return new ToolResult({ output: "Right click performed." });
  
        case "middle_click":
          window.Log("Performing middle click.");
          window.DoClick("M");
          return new ToolResult({ output: "Middle click performed." });
  
        case "double_click":
          window.Log("Performing double click.");
          window.DoClick("LD");
          return new ToolResult({ output: "Double click performed." });
  
        // Keyboard actions
        case "key":
          if (!action.text) {
            throw new Error("Key text is required for key action.");
          }
          const sendKey = this.convertToSendKeys(action.text);
          window.Log(`Sending key: "${action.text}"`);
          window.DoSendKeys(sendKey);
          return new ToolResult({ output: `Key "${action.text}" sent.` });
  
        case "type":
          if (!action.text) {
            throw new Error("Text is required for type action.");
          }
          window.Log(`Typing text: "${action.text}"`);
          window.DoSendKeys(action.text);
          return new ToolResult({ output: `Typed text: "${action.text}".` });
  
        // Utility actions
        case "cursor_position":
          window.Log("Getting cursor position.");
          const cursorPosition = window.GetCursorPosition();
          return new ToolResult({ output: `Cursor is at position (${cursorPosition.x}, ${cursorPosition.y}).` });
  
        case "screenshot":
          window.Log("Capturing screenshot.");
          const screenshotBase64 = window.GetScreenshot();
          return new ToolResult({
            output: "Screenshot captured.",
            base64_image: screenshotBase64,
          });
  
        // Rapise tool actions
        case "rapise_assert":
          if (typeof action.text !== "string" || typeof action.pass !== "boolean") {
            throw new Error("Text and pass must be provided for rapise_assert action.");
          }
          window.Log(`Performing assertion: "${action.text}", Pass: ${action.pass}`);
          window.Assert(action.text, action.pass, action.additionalData);
          return new ToolResult({ output: `Assertion executed: ${action.text}, Pass: ${action.pass}.` });
  
        case "rapise_set_return_value":
          if (action.val === undefined) {
            throw new Error("Value must be provided for rapise_set_return_value action.");
          }
          window.Log(`Setting return value to: ${action.val}`);
          window.SetReturnValue(action.val);
          return new ToolResult({ output: `Return value set to: ${action.val}` });
  
        case "rapise_print_message":
          if (!action.text) {
            throw new Error("Text must be provided for rapise_print_message action.");
          }
          window.PrintReportMessage(action.text);
          return new ToolResult({ output: `Message logged: "${action.text}".` });
  
        // Unknown or unsupported action
        default:
          throw new Error(`Unsupported action: ${action.action}`);
      }
    } catch (error: any) {
      window.Log(`Error occurred during action "${action.action}": ${error.message}`);
      return new ToolResult({ error: error.message });
    }
  }  

  private static makeToolResultPayload(result: ToolResult, toolUseId: string): any {
    const toolResultContent: any[] = [];
    let isError = false;

    if (result.error) {
      isError = true;
      toolResultContent.push({ type: "text", text: `<error>${result.error}</error>` });
    } else {
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

  private static filterRecentImages(messages: any[], n_last_images: number): void {
    const imageMessages = messages.filter((msg) =>
      msg.content.some((contentItem: any) => contentItem.type === "image")
    );
  
    const excessImages = imageMessages.length - n_last_images;
  
    if (excessImages > 0) {
      for (let i = 0; i < excessImages; i++) {
        const oldestImageIndex = messages.findIndex((msg) =>
          msg.content.some((contentItem: any) => contentItem.type === "image")
        );
        if (oldestImageIndex !== -1) {
          messages.splice(oldestImageIndex, 1); // Remove the oldest image message
        }
      }
    }
  }

  private static isValidationException(response: any): boolean {
    return (
      typeof response === "object" &&
      response !== null &&
      response.name === "ValidationException" &&
      response.$fault === "client" &&
      response.$metadata?.httpStatusCode === 400
    );
  }

  private static async processResponse(
    payload: AnthropicPayload,
    imgMeta: ProcessImageResult,
    response: AnthropicResponse,
    chatStatus: ChatStatus,
    window: TargetWindow
  ): Promise<boolean> {
    window.Log(`Processing response: ${JSON.stringify(response, null, 2)}`);
  
    chatStatus.input_tokens += response.usage.input_tokens;
    chatStatus.output_tokens += response.usage.output_tokens;
    chatStatus.stop_reason = response.stop_reason;
  
    let cumulativeResult = new ToolResult({});
    const scaleFactor = imgMeta.scale_factor;
  
    for (const contentItem of response.content) {
      if (contentItem.type === "text") {
        // Use AssistantText to display just the text content
        if (contentItem.text) {
          window.AssistantText(contentItem.text);
        }
        continue;
      } else if (contentItem.type === "tool_use") {
        chatStatus.tool_invocations++; // Increment tool invocation count
  
        const action: ToolUseAction = {
          action: contentItem.input?.action as Action,
          text: contentItem.input?.text, // Assign from contentItem.input.text
          coordinate: contentItem.input?.coordinate as [number, number] | undefined,
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
        } catch (error) {
          // Call ActionEnd only if an exception occurs
          window.ActionEnd(actionKey, `Error: ${(error as Error).message}`);
          throw error; // Rethrow the error to propagate it
        }
      }
    }
  
    if (cumulativeResult.isNonEmpty()) {
      window.Log(`Tool execution result: ${JSON.stringify(cumulativeResult, null, 2)}`);
    }
  
    return response.stop_reason === "tool_use";
  }

  public static async toolUseLoop(
    prompt: string,
    window: TargetWindow,
    last: {
      payload?: AnthropicPayload;
      response?: AnthropicResponse;
      imgMeta?: ProcessImageResult;
      chatStatus?: ChatStatus;
    },
    max_tokens: number = 10000,
    n_last_images: number = 3,
    timeout: number = 600000, // Default timeout: 10 minutes
    token_limit: number = 1000000 // Default token limit: 1 million
  ): Promise<ChatStatus> {
    const shouldIgnoreLast = last?.chatStatus?.stop_reason !== "tool_use";
  
    const chatStatus: ChatStatus = !shouldIgnoreLast && last?.chatStatus
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
  
    let payload: AnthropicPayload;
    let imgMeta: ProcessImageResult;
  
    if (!shouldIgnoreLast && last?.payload) {
      payload = last.payload;
      imgMeta = last.imgMeta!;
      window.Log("Using last payload and image metadata for the chat session.");
    } else {
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
            display_height_px: imgMeta.metadata_scaled.height!,
            display_width_px: imgMeta.metadata_scaled.width!,
            display_number: 0,
          },
          {
            name: "rapise_assert",
            description: "Perform an assertion during the automation process",
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
            description: "Set a return value for later use",
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
            description: "Log a message during the automation process",
            input_schema: {
              type: "object",
              properties: {
                text: { type: "string", description: "The message to log" },
              },
              required: ["text"],
            },
          },
        ],
        anthropic_beta: ["computer-use-2024-10-22"],
      };
      window.Log("Created a new payload for the chat session.");
    }
  
    const startTime = Date.now();
    let response: AnthropicResponse | undefined = !shouldIgnoreLast ? last?.response : undefined;
  
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
            Global.DoSleep(1000); // Delay for 1 second
            response = undefined; // Clear response to retry
            if (retries >= 3) {
              throw new Error("Exceeded maximum retries due to ValidationException.");
            }
            continue; // Retry logic
          }
  
          break; // Exit retry loop if no ValidationException
        } catch (error: any) {
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
  
      if (!shouldContinue) break;
  
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
