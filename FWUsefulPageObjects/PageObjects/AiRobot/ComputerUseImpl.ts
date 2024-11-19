import sharp from 'sharp';

// Interfaces for external objects
interface Tester {
  Assert(description: string, condition: boolean, attachments: any[]): void;
  Message(message: string): void;
}

interface Navigator {
  [key: string]: any;
}

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
declare var Navigator: Navigator;
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

interface AnthropicPayload {
  anthropic_version: string;
  max_tokens: number;
  messages: {
    role: string;
    content: { type: string; text?: string; source?: { type: string; media_type: string; data: string } }[];
  }[];
  tools: {
    type: string;
    name: string;
    display_height_px?: number;
    display_width_px?: number;
    display_number?: number;
  }[];
  anthropic_beta: string[];
}

interface AnthropicResponseContent {
  type: "text" | "tool_use" | "tool_result";
  text?: string; // For text content
  input?: {
    action?: string;
    coordinate?: [number, number];
    text?: string; // Added here to capture text input for tool_use
  };
  id?: string; // For identifying tool_use blocks
  name?: string; // Name of the tool being invoked
  content?: any[]; // For tool_result content blocks
}


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

interface ToolUseAction {
  action: Action;
  text?: string;
  coordinate?: [number, number];
}

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
  GetScreenshot(): string;
  DoClick(clickType: "L" | "R" | "M" | "LD" | "RD" | "MD"): void;
  DoMouseMove(x: number, y: number): void;
  DoMouseDragTo(x: number, y: number): void;
  DoSendKeys(keys: string): void;
  GetCursorPosition(): { x: number; y: number };
  Log(msg: string): void;
  ActionStart(actionKey: string, msg: string): void;
  ActionEnd(actionKey: string, output?: string): void;

  /**
   * Registers the payload, response, image metadata, and chat status for tracking or debugging.
   * @param payload The payload sent to the API.
   * @param response The response received from the API.
   * @param imgMeta The metadata of the processed image.
   * @param chatStatus The current status of the chat session.
   */
  RegisterResponse(
    payload: AnthropicPayload,
    response: AnthropicResponse,
    imgMeta: ProcessImageResult,
    chatStatus: any
  ): void;
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
      "Return": "{ENTER}",
      "BackSpace": "{BACKSPACE}",
      "Tab": "{TAB}",
      "Escape": "{ESC}",
      "space": " ",
      "F1": "{F1}", "F2": "{F2}", "F3": "{F3}", "F4": "{F4}",
      "F5": "{F5}", "F6": "{F6}", "F7": "{F7}", "F8": "{F8}",
      "F9": "{F9}", "F10": "{F10}", "F11": "{F11}", "F12": "{F12}",
    };
  
    // Extract modifiers and main key
    const parts = xdtoolKey.split(" ");
    const modifiers = parts.slice(0, -1); // All but last part
    const mainKey = parts[parts.length - 1];
  
    // Handle key mapping
    let sendKey = keyMap[mainKey] || mainKey; // Map or leave unchanged
  
    // Apply modifiers
    for (const mod of modifiers) {
      if (mod === "Ctrl") sendKey = `^${sendKey}`;
      if (mod === "Alt") sendKey = `%${sendKey}`;
      if (mod === "Shift") sendKey = `+${sendKey}`;
    }
  
    return sendKey;
  }
  
  private static async processToolUseAction(
    action: ToolUseAction,
    window: TargetWindow,
    scaleFactor: number
  ): Promise<ToolResult> {
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
    } catch (error) {
      result.error = `Failed to perform action ${action.action}: ${(error as Error).message}`;
    } finally {
      window.ActionEnd(actionKey, result.output ?? result.error);
    }

    return result;
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

  private static async processResponse(
    payload: AnthropicPayload,
    imgMeta: ProcessImageResult,
    response: AnthropicResponse,
    chatStatus: any,
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
        // Handle text blocks as needed
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
      chatStatus?: any;
    },
    max_tokens: number = 10000,
    n_last_images: number = 3,
    timeout: number = 300000, // Default timeout: 5 minutes
    token_limit: number = 1000000 // Default token limit: 1 million
  ): Promise<any> {
    const shouldIgnoreLast = last?.chatStatus?.stop_reason !== "tool_use";
  
    const chatStatus = !shouldIgnoreLast && last?.chatStatus
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
  
      if (!response) {
        let retries = 0;
        while (retries < 3) {
          try {
            response = AiServerClient.QueryRaw(payload, { defaultModelApiType: "bedrock" });
            window.Log("Fetched a new response from the server.");
            chatStatus.prompt_queries++; // Increment prompt query count
            break; // Exit retry loop on success
          } catch (error: any) {
            retries++;
            window.Log(`Retry ${retries}: Error querying the API - ${error.message}`);
            if (error.message.includes("ValidationError") && retries < 3) {
              window.Log("Retrying due to ValidationError...");
            } else {
              throw new Error(`Failed after ${retries} retries: ${error.message}`);
            }
          }
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
  
    // Register the final state after exiting the loop
    window.RegisterResponse(payload, response, imgMeta, chatStatus);
  
    // Update success based on the final stop reason
    chatStatus.success = chatStatus.stop_reason === "end_turn";
    window.Log(`Final response: ${JSON.stringify(response, null, 2)}`);
  
    return chatStatus; // Return the updated chatStatus
  }
  
  
}

