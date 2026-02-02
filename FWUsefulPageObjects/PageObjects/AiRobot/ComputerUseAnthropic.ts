import {
  ChatStatus, 
  TargetWindow, 
  TAiServerClient, 
  TGlobal, 
  ProcessImageResult, 
  ComputerUseUtils,
  ToolResult} from './ComputerUseTypes'; // Assuming you have a separate file for types
import deasync from 'deasync';

declare var Global: TGlobal;
declare var AiServerClient: TAiServerClient;

type AnthropicPayload = {
  anthropic_version: string;
  system?: string;
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

type Action241022 =
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

type Action251022 =  
  | "left_mouse_down"
  | "left_mouse_up"
  | "scroll"
  | "hold_key"
  | "wait"
  | "triple_click";

type Action = Action241022 | Action251022;

type ToolUseAction = {
  action: Action; // Use the Action type here
  text?: string; // Optional text for typing, logging, or assertions
  coordinate?: [number, number]; // Optional coordinates for mouse-related actions
  pass?: boolean; // Optional boolean for assertion success/failure
  val?: string | number | boolean; // Optional value for setting return values
  duration?: number; // Optional duration for wait actions
  scroll_direction?: string; // Optional direction for scroll actions
  scroll_amount?: number; // Optional amount for scroll actions
  additionalData?: string; // Optional additional context for assertions
};

type VersionConfig = {
  anthropic_version: string;
  tools_computer: string;
  anthropic_beta: string;
  version: string;
};

export const versionConfig35: VersionConfig = {
  anthropic_version: "bedrock-2023-05-31",
  tools_computer: "computer_20241022",
  anthropic_beta: "computer-use-2024-10-22",
  version: "3.5"
}

export const versionConfig37: VersionConfig = {
  anthropic_version: "bedrock-2023-05-31",
  tools_computer: "computer_20250124",
  anthropic_beta: "computer-use-2025-01-24",
  version: "3.7"
}

export class ComputerUseAnthropic {


  private static processToolUseAction(
    action: ToolUseAction,
    window: TargetWindow,
    scaleFactor: number
  ): ToolResult {
    try {
      let extraData = "";
      switch (action.action) {
        // Mouse actions
        case "mouse_move":
          if (!action.coordinate) {
            throw new Error("Coordinate is required for mouse_move action.");
          }
          const [moveX, moveY] = ComputerUseUtils.applyScaling(action.coordinate, scaleFactor);
          window.Log(`Moving mouse to (${moveX}, ${moveY})`);
          window.DoMouseMove(moveX, moveY);
          return new ToolResult({ output: `Mouse moved to (${moveX}, ${moveY})` });
  
        case "left_click":
          if(action.coordinate) {
            const [clickX, clickY] = ComputerUseUtils.applyScaling(action.coordinate, scaleFactor);
            window.Log(`Performing left click at (${clickX}, ${clickY})`);
            window.DoMouseMove(clickX, clickY);
            window.DoClick("L");
            return new ToolResult({ output: `Left click performed at (${clickX}, ${clickY})` });
          } else {
            window.Log("Performing left click.");
            window.DoClick("L");
            return new ToolResult({ output: "Left click performed." });  
          }
  
        case "left_click_drag":
          if (!action.coordinate) {
            throw new Error("Coordinate is required for left_click_drag action.");
          }
          const [dragX, dragY] = ComputerUseUtils.applyScaling(action.coordinate, scaleFactor);
          window.Log(`Dragging mouse to (${dragX}, ${dragY})`);
          window.DoMouseDragTo(dragX, dragY);
          return new ToolResult({ output: `Mouse dragged to (${dragX}, ${dragY})` });
  
        case "right_click":
          if(action.coordinate) {
            const [clickX, clickY] = ComputerUseUtils.applyScaling(action.coordinate, scaleFactor);
            extraData = `at (${clickX}, ${clickY})`;
            window.DoMouseMove(clickX, clickY);
          }
          window.Log(`Performing right click${extraData}.`);
          window.DoClick("R");
          return new ToolResult({ output: "Right click performed." });
  
        case "middle_click":
          if(action.coordinate) {
            const [clickX, clickY] = ComputerUseUtils.applyScaling(action.coordinate, scaleFactor);
            extraData = `at (${clickX}, ${clickY})`;
            window.DoMouseMove(clickX, clickY);
          }
          window.Log(`Performing middle click${extraData}.`);
          window.DoClick("M");
          return new ToolResult({ output: "Middle click performed." });
  
        case "double_click":
          if(action.coordinate) {
            const [clickX, clickY] = ComputerUseUtils.applyScaling(action.coordinate, scaleFactor);
            extraData = `at (${clickX}, ${clickY})`;
            window.DoMouseMove(clickX, clickY);
          }

          window.Log(`Performing double click${extraData}.`);
          window.DoClick("LD");
          return new ToolResult({ output: `Double click performed${extraData}.` });

        case "triple_click":
          if(action.coordinate) {
            const [clickX, clickY] = ComputerUseUtils.applyScaling(action.coordinate, scaleFactor);
            extraData = `at (${clickX}, ${clickY})`;
            window.DoMouseMove(clickX, clickY);
          }

          window.Log(`Performing triple click${extraData}.`);
          window.DoClick("LD");
          window.DoClick("L");
          return new ToolResult({ output: `Triple click performed${extraData}.` });
    
        // Keyboard actions
        case "key":
          if (!action.text) {
            throw new Error("Key text is required for key action.");
          }
          const sendKey = ComputerUseUtils.convertToSendKeys(action.text);
          window.Log(`Sending key: "${action.text}"`);
          window.DoSendKeys(sendKey);
          return new ToolResult({ output: `Key "${action.text}" sent.` });
  
        case "type":
          if (!action.text) {
            throw new Error("Text is required for type action.");
          }
          const escapedText = ComputerUseUtils.escapeSendKeysSpecialChars(action.text);
          window.Log(`Typing text: "${action.text}"`);
          window.DoSendKeys(escapedText);
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

        case "wait":
          const duration = action.duration;
          Global.DoSleep(1000*duration);
          const screenshotAfterWaitBase64 = window.GetScreenshot();
          return new ToolResult({
            output: "Wait done.",
            base64_image: screenshotAfterWaitBase64,
          });

        case "hold_key":
          window.DoSendKeys(ComputerUseUtils.convertToSendKeys(action.text), action.duration);
          return new ToolResult({
            output: "Key pressed."
          });

        case "scroll":
          let scrollX = 0;
          let scrollY = 0;
          switch(action.scroll_direction)
          {
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

          if(action.coordinate) {
            const [clickX, clickY] = ComputerUseUtils.applyScaling(action.coordinate, scaleFactor);
            window.DoMouseMove(clickX, clickY);
            window.DoClick("L");
          }

          if(action.text)
          {
            // TODO: press button before scrolling
            window.DoScroll(scrollX, scrollY);
            return new ToolResult({ output: `Scrolled by (${scrollX}, ${scrollY})` });
          } else {
            window.DoScroll(scrollX, scrollY);
            return new ToolResult({ output: `Scrolled by (${scrollX}, ${scrollY})` });
          }

          break;
        case "left_mouse_down":
          window.Log(`Pressing left mouse button`);
          window.DoMousePress("L");
          return new ToolResult({ output: `Left mouse button pressed` });

        case "left_mouse_up":
          window.Log(`Releasing left mouse button`);
          window.DoMouseRelease("L");
          return new ToolResult({ output: `Left mouse button released` });
  
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
    // Track all image locations: direct images and nested images inside tool_result objects
    type ImageLocation = {
      messageIndex: number;
      contentIndex: number;
      nestedIndex?: number; // If image is nested inside tool_result.content
    };

    const imageLocations: ImageLocation[] = [];

    messages.forEach((msg, msgIndex) => {
      if (!msg.content || !Array.isArray(msg.content)) return;
      
      msg.content.forEach((contentItem: any, contentIndex: number) => {
        // Direct image at message.content[i]
        if (contentItem.type === "image") {
          imageLocations.push({ messageIndex: msgIndex, contentIndex });
        }
        // Nested image inside tool_result.content[j] or similar objects with content array
        else if (contentItem.content && Array.isArray(contentItem.content)) {
          contentItem.content.forEach((nestedItem: any, nestedIndex: number) => {
            if (nestedItem.type === "image") {
              imageLocations.push({ messageIndex: msgIndex, contentIndex, nestedIndex });
            }
          });
        }
      });
    });

    const totalImages = imageLocations.length;
    const excessImages = totalImages - n_last_images;

    if (excessImages > 0) {
      // Remove oldest images first (from the beginning of the array)
      const locationsToRemove = imageLocations.slice(0, excessImages);

      // Sort in reverse order to safely remove without index shifting issues
      // First by messageIndex desc, then contentIndex desc, then nestedIndex desc
      locationsToRemove.sort((a, b) => {
        if (a.messageIndex !== b.messageIndex) return b.messageIndex - a.messageIndex;
        if (a.contentIndex !== b.contentIndex) return b.contentIndex - a.contentIndex;
        return (b.nestedIndex ?? -1) - (a.nestedIndex ?? -1);
      });

      for (const loc of locationsToRemove) {
        const message = messages[loc.messageIndex];
        if (loc.nestedIndex !== undefined) {
          // Remove nested image from tool_result.content
          message.content[loc.contentIndex].content.splice(loc.nestedIndex, 1);
        } else {
          // Remove direct image from message.content
          message.content.splice(loc.contentIndex, 1);
        }
      }
    }
  }

  private static isValidationException(response: any): boolean {
    return (
      response == null ||
      (
        typeof response === "object" && response.$fault
      )
    );
  }

  private static processResponse(
    payload: AnthropicPayload,
    imgMeta: ProcessImageResult,
    response: AnthropicResponse,
    chatStatus: ChatStatus,
    window: TargetWindow
  ): boolean {
    window.Log(`Processing response: ${JSON.stringify(response, null, 2)}`, 4);
  
    chatStatus.input_tokens += response.usage.input_tokens;
    chatStatus.output_tokens += response.usage.output_tokens;
    chatStatus.stop_reason = response.stop_reason;
  
    let cumulativeResult = new ToolResult({});
    const toolResultsPayload = [];
    const scaleFactor = imgMeta.scale_factor;
  
    for (const contentItem of response.content) {
      if (contentItem.type === "text") {
        if (contentItem.text) {
          window.AssistantText(contentItem.text);
        }
        continue;
      } else if (contentItem.type === "tool_use") {
        chatStatus.tool_invocations++;
  
        const toolName = contentItem.name; // Identify the tool name
        const actionInput = contentItem.input;
        const actionId = contentItem.id;
  
        const actionKey = `${toolName}-${actionId}`;
        window.ActionStart(actionKey, `Executing action: ${toolName}`);
  
        try {
          // Construct the ToolUseAction based on the tool name
          let action: ToolUseAction;
  
          switch (toolName) {
            case "rapise_assert":
            case "rapise_set_return_value":
            case "rapise_print_message":
              action = {
                action: toolName as Action,
                text: actionInput.text,
                pass: actionInput.pass,
                val: actionInput.val,
                additionalData: actionInput.additionalData,
              };
              break;
  
            case "computer":
              action = {
                action: actionInput.action as Action,
                text: actionInput.text,
                coordinate: actionInput.coordinate as [number, number] | undefined,
              };
              break;
  
            default:
              throw new Error(`Unsupported tool name: ${toolName}`);
          }
  
          const result = this.processToolUseAction(action, window, scaleFactor);
          cumulativeResult = cumulativeResult.add(result);
  
          // Prepare the tool result payload
          toolResultsPayload.push(this.makeToolResultPayload(result, contentItem.id));

  
        } catch (error) {
          window.ActionEnd(actionKey, `Error: ${(error as Error).message}`);
          // Prepare the error result payload
          const errorResult = new ToolResult({ error: (error as Error).message });
          toolResultsPayload.push(this.makeToolResultPayload(errorResult, contentItem.id));
          // Optionally, you might want to rethrow the error or handle it accordingly
        }
      }
    }
  
    if (cumulativeResult.isNonEmpty()) {
      const {base64_image, output, error, system} = cumulativeResult;
      window.Log(`Tool execution result: ${JSON.stringify({output, error, system}, null, 2)}`, 4);

      payload.messages.push({
        role: "user",
        content: toolResultsPayload,
      });

    }
  
    return response.stop_reason === "tool_use";
  }

  public static toolUseLoop(
    prompt: string,
    window: TargetWindow,
    system_prompt?: string,
    max_tokens: number = 10000,
    n_last_images: number = 3,
    timeout: number = 600000, // Default timeout: 10 minutes
    token_limit: number = 1000000, // Default token limit: 1 million
    versionConfig: VersionConfig = versionConfig35,
    last?: {
      payload?: AnthropicPayload;
      response?: AnthropicResponse;
      imgMeta?: ProcessImageResult;
      chatStatus?: ChatStatus;
    }
  ): ChatStatus {
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

    window.Log(prompt);
  
    if (!shouldIgnoreLast && last?.payload) {
      payload = last.payload;
      imgMeta = last.imgMeta!;
      window.Log("Using last payload and image metadata for the chat session.");
    } else {
      const base64Image = window.GetScreenshot();
      const imageBuffer = Buffer.from(base64Image, "base64");
      imgMeta = ComputerUseUtils.processImage(imageBuffer);
  
      // Wrap the async toBuffer call in deasync to make it synchronous
      let scaledImageBuffer: Buffer | undefined = undefined;
      imgMeta.img_scaled.toBuffer().then(buf => { scaledImageBuffer = buf; }).catch(err => {
          window.Log("Error scaling image: " + err.message);
          scaledImageBuffer = Buffer.from(""); // Return empty buffer on error
      });
      while (scaledImageBuffer === undefined) {
        deasync.runLoopOnce();
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
            display_height_px: imgMeta.metadata_scaled.height!,
            display_width_px: imgMeta.metadata_scaled.width!,
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
            delay=delay*3;
            continue; // Retry logic
          }
  
          break; // Exit retry loop if no ValidationException
        } catch (error: any) {
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
    window.Log(`Final response: ${JSON.stringify(response, null, 2)}`, 4);
  
    return chatStatus; // Return the updated chatStatus
  }

}

