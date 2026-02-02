import {
  ChatStatus,
  TargetWindow,
  TAiServerClient,
  TGlobal,
  ProcessImageResult,
  ComputerUseUtils,
  ToolResult,
} from "./ComputerUseTypes";
import deasync from "deasync";

declare var Global: TGlobal;
declare var AiServerClient: TAiServerClient;
declare var g_commandInterval: number;

// Qwen tool-call text blocks look like:
// <tool_call>
// {"name":"computer_use","arguments":{"action":"left_click","coordinate":[183,524]}}
// </tool_call>

export type QwenChatMessage = {
  role: "system" | "user" | "assistant";
  // DashScope OpenAI-compatible supports array content items
  content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  >;
};

export type QwenChatPayload = {
  messages: QwenChatMessage[];
  // model is typically set server-side in your AiServerClient, but leaving optional
  model?: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
};

export type QwenChatResponse = {
  choices?: Array<{
    message?: { 
      content?: string;
      tool_calls?: Array<{
        type: string;
        function: {
          name: string;
          arguments: string | any;
        };
      }>;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: any;
};

export type ComputerUseAction =
  | "key"
  | "type"
  | "mouse_move"
  | "left_click"
  | "left_click_drag"
  | "right_click"
  | "middle_click"
  | "double_click"
  | "triple_click"
  | "scroll"
  | "hscroll"
  | "wait"
  | "terminate"
  | "answer";

export type ToolCallEnvelope = {
  name: string;
  arguments: any;
};

export class ComputerUseQwen {
  static imgMeta: ProcessImageResult;

  // Qwen coordinate space is ALWAYS 0..1000
  static mapCoord1000ToPhysical(
    coord1000: [number, number],
    imgMeta: ProcessImageResult
  ): [number, number] {
    const w = imgMeta.metadata_scaled.width || 1024;
    const h = imgMeta.metadata_scaled.height || 768;

    // 0..1000 -> scaled canvas pixels
    const scaledX = Math.floor(coord1000[0] * (w - 1) / 999);
    const scaledY = Math.floor(coord1000[1] * (h - 1) / 999);

    console.log(`${coord1000[0]},${coord1000[1]}-->${scaledX},${scaledY} (w: ${JSON.stringify(imgMeta.metadata_scaled)})`)

    // scaled canvas -> physical screen pixels (undo scaling)
    return [scaledX, scaledY];
  }

  static getScreenshot(window: TargetWindow): string {
    const base64Image = window.GetScreenshot();
    const imageBuffer = Buffer.from(base64Image, "base64");
    //this.imgMeta = ComputerUseUtils.wrapImage(imageBuffer,{width:512,height:512});
    this.imgMeta = ComputerUseUtils.wrapImage(imageBuffer);

    let scaledImageBuffer: Buffer | undefined = undefined;
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
      deasync.runLoopOnce();
    }
    return scaledImageBuffer.toString("base64");
  }

  static buildToolSystemPrompt(displayW = 1000, displayH = 1000): string {
    // Keep this aligned with the python NousFnCallPrompt template.
    const computerUseFn = {
      type: "function",
      function: {
        name: "computer_use",
        description:
          "Use a mouse and keyboard to interact with a computer, and take screenshots.\n" +
          "* This is an interface to a desktop GUI. You do not have access to a terminal or applications menu. You must click on desktop icons to start applications.\n" +
          "* Some applications may take time to start or process actions, so you may need to wait and take successive screenshots to see the results of your actions.\n" +
          `* The screen's resolution is ${displayW}x${displayH}.\n` +
          `* Use keyboard to interact with combo dropdowns (when value is not visible on the screen) and long lists (quick type to search, home/end, page up/page down). Prefer keyboard to scrolling whenever possible.\n` +
          "* Whenever you intend to move the cursor to click on an element like an icon, you should consult a screenshot to determine the coordinates of the element before moving the cursor.\n" +
          "* Make sure to click any buttons, links, icons, etc with the cursor tip in the center of the element. If it is an input field, point cursor tip to the center of current value. Don't click boxes on their edges."+
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
              description:`
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
              description:
                "(x,y) in 0..1000 coordinate space. Required for mouse_move/click/drag actions.",
            },
            pixels: {
              type: "number",
              description:
                "Scroll amount. Positive=up, negative=down. Required for scroll/hscroll.",
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
        description:
          "Perform an assertion during the automation process. Only do this when user asks to check or validate something explicitly.",
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
        description:
          "Set a return value for later use. Do this when user asks to store a value for later use or to capture some value.",
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
        description:
          "Log a message during the automation process. Do this when user explicitly asks to output or print something.",
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

    return (
`# Tools

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
`
    );
  }

  static queryLlm(payload: QwenChatPayload, chatStatus: ChatStatus): QwenChatResponse {
    const resp: QwenChatResponse = AiServerClient.QueryRaw(payload);

    chatStatus.prompt_queries += 1;
    chatStatus.input_tokens += resp.usage?.prompt_tokens || 0;
    chatStatus.output_tokens += resp.usage?.completion_tokens || 0;

    return resp;
  }


  static extractToolCalls(text: string, response?: QwenChatResponse): {calls:ToolCallEnvelope[],text:string} {
    const calls: ToolCallEnvelope[] = [];

    // First, try to extract from OpenAI-style tool_calls in the response object
    if (response?.choices?.[0]?.message?.tool_calls) {
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
          } catch (e) {
            // ignore malformed tool calls
          }
        }
      }
    }

    // If we found tool calls in the response object, return them
    if (calls.length > 0) {
      return {calls,text};
    }

    // Fallback: try to extract from XML-style tool calls in text content
    if (!text) return {calls:[],text};

    const re = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/g;
    let m: RegExpExecArray | null;

    while ((m = re.exec(text)) !== null) {
      const raw = (m[1] || "").trim();
      if (!raw) continue;

      try {
        const obj = JSON.parse(raw);
        if (obj && typeof obj.name === "string" && obj.arguments) {
          calls.push(obj);
        }
      } catch {
        // ignore malformed blocks
      }
    }

    // Only keep Action: and remove the <tool_call> part.
    const cleanedText = text.split('<tool_call>')[0];
    return {calls, text: cleanedText};
  }

  static toolResponseText(obj: any): string {
    // Mirror NousFnCallPrompt: FUNCTION => USER with <tool_response> wrapper.
    // Keep it simple: put JSON payload inside.
    const body = JSON.stringify(obj ?? {}, null, 2);
    return `<tool_response>\n${body}\n</tool_response>`;
  }

  static handleRapiseFunction(window: TargetWindow, name: string, args: any): ToolResult {
    switch (name) {
      case "rapise_assert": {
        const { text, pass, additionalData } = args || {};
        if (typeof text !== "string" || typeof pass !== "boolean") {
          return new ToolResult({ error: "rapise_assert requires {text:string, pass:boolean}" });
        }
        window.Assert(text, pass, additionalData);
        return new ToolResult({ output: `Assertion executed: ${text} => ${pass}` });
      }
      case "rapise_set_return_value": {
        const { val } = args || {};
        if (val === undefined) {
          return new ToolResult({ error: "rapise_set_return_value requires {val}" });
        }
        window.SetReturnValue(val);
        return new ToolResult({ output: `Return value set: ${val}` });
      }
      case "rapise_print_message": {
        const { text } = args || {};
        if (typeof text !== "string") {
          return new ToolResult({ error: "rapise_print_message requires {text:string}" });
        }
        window.PrintReportMessage(text);
        return new ToolResult({ output: `Message logged: ${text}` });
      }
      default:
        return new ToolResult({ error: `Unknown function: ${name}` });
    }
  }

  static mouseMove(window: TargetWindow, chatStatus: ChatStatus, c: [number,number], action: string):ToolResult {
      if ( c[0]<0 ) {
        return new ToolResult({ error: `${action} x should be >= 0, now it is ${c[0]}` });
      }
      if ( c[1]<0 ) {
        return new ToolResult({ error: `${action} y should be >= 0, now it is ${c[1]}` });
      }
      if ( c[0]>=1000 ) {
        return new ToolResult({ error: `${action} x should be < 1000, now it is ${c[0]}` });
      }
      if ( c[1]>=1000 ) {
        return new ToolResult({ error: `${action} y should be < 1000, now it is ${c[1]}` });
      }
      const [x, y] = this.mapCoord1000ToPhysical(c, this.imgMeta);
      window.DoMouseMove(x, y+5);
      chatStatus.tool_invocations += 1;
      
      if ( action=="mouse_move" ) {
        return new ToolResult({ output: `Mouse moved to (${x}, ${y})` });
      }

      return null;
  }

  static handleComputerUse(window: TargetWindow, args: any, chatStatus: ChatStatus): ToolResult {
    const action: ComputerUseAction = args?.action;
    if (!action) return new ToolResult({ error: "computer_use requires {action}" });

    try {
      switch (action) {
        case "mouse_move": {
          const c = args.coordinate as [number, number];
          if (!c) return new ToolResult({ error: "mouse_move requires coordinate" });
          const r = this.mouseMove(window, chatStatus, c, 'mouse_move');
          return r;
        }

        case "left_click":
        case "right_click":
        case "middle_click":
        case "double_click":
        case "triple_click": {
          const c = args.coordinate as [number, number] | undefined;
          let clickType: "L" | "R" | "M" | "LD" = "L";
          if (action === "right_click") clickType = "R";
          if (action === "middle_click") clickType = "M";
          if (action === "double_click") clickType = "LD";

          const r = this.mouseMove(window, chatStatus, c, action);
          if( r ) {
            Global.DoSleep(300);
            return r;
          }


          if (action === "triple_click") {
            // closest available: double + single (same as your Anthropic)
            window.DoClick("LD");
            window.DoClick("L");
          } else {
            window.DoClick(clickType);
          }
          Global.DoSleep(500);

          chatStatus.tool_invocations += 1;
          return new ToolResult({ output: `Click action: ${action}` });
        }

        case "left_click_drag": {
          const c = args.coordinate as [number, number];
          if (!c) return new ToolResult({ error: "left_click_drag requires coordinate" });
          const [x, y] = this.mapCoord1000ToPhysical(c, this.imgMeta);
          window.DoMouseDragTo(x, y);
          chatStatus.tool_invocations += 1;
          return new ToolResult({ output: `Dragged to (${x}, ${y})` });
        }

        case "key": {
          const keys = (args.keys || []) as string[];
          if (!Array.isArray(keys) || keys.length === 0) {
            return new ToolResult({ error: "key requires keys[]" });
          }
          
          // Join keys with '+' for combinations (e.g., ["ctrl", "a"] becomes "ctrl+a")
          const keyCombo = keys.join("+");
          const sendKey = ComputerUseUtils.convertToSendKeys(keyCombo);
          window.DoSendKeys(sendKey);
          
          chatStatus.tool_invocations += 1;
          return new ToolResult({ output: `Key combination sent: ${keyCombo} -> ${sendKey}` });
        }


        case "type": {
          const text = String(args.text ?? "");
          if (!text) return new ToolResult({ error: "type requires text" });

          const c = args.coordinate as [number, number] | undefined;
          if (c) {
            // Activate field with triple_click
            const r = this.mouseMove(window, chatStatus, c, action);
            if( r ) {
              window.DoClick("LD");
              window.DoClick("L");
            }
          } else {
            window.DoSendKeys("^a{DEL}");
          }

          window.DoSendKeys(ComputerUseUtils.escapeSendKeysSpecialChars(text));
          chatStatus.tool_invocations += 1;
          return new ToolResult({ output: `Typed: ${text}` });
        }

        case "scroll":
        case "hscroll": {
          const pixels1000 = Number(args.pixels ?? 0);
          
          // Scale scroll amount from 1000-space to physical pixels
          const h = this.imgMeta.metadata_scaled.height || 768;
          const scaledPixels = Math.round((pixels1000 / 1000 ) * h );

          // Map to vertical scroll only (like python note for hscroll)
          window.DoScroll(0, scaledPixels);
          Global.DoSleep(500);
          chatStatus.tool_invocations += 1;
          return new ToolResult({ output: `Scrolled: ${pixels1000} (1000-space) -> ${scaledPixels} (physical pixels)` });
        }

        case "wait": {
          const t = Number(args.time ?? 0);
          const ms = Math.max(0, Math.round(t * 1000));
          Global.DoSleep(ms);
          chatStatus.tool_invocations += 1;
          return new ToolResult({ output: `Waited: ${t}s` });
        }

        case "answer": {
          const text = String(args.text ?? "");
          window.AssistantText(text);
          window.SetReturnValue(text);
          chatStatus.tool_invocations += 1;
          return new ToolResult({ output: `Answer: ${text}` });
        }

        case "terminate": {
          const status = String(args.status ?? "failure");
          chatStatus.stop_reason = "terminate";
          chatStatus.success = status === "success";
          chatStatus.tool_invocations += 1;
          return new ToolResult({ output: `Terminated: ${status}` });
        }

        default:
          return new ToolResult({ error: `Unsupported action: ${action}` });
      }
    } catch (e: any) {
      return new ToolResult({ error: e?.message || String(e) });
    }
  }

  private static user_prompt_prefix2: string = `Explain your intent before doing each step.

After activating text field for typing check if there is current value and if it is selected. If current value is not selected, use action: triple_click to select current value before typing.
If input field and its current value is not properly visible, scroll it into view using the 'scroll' tool.
If field is close to the edge and you may scroll it, then first scroll the field into view properly.

`;
  private static user_prompt_prefix: string = ``;

  public static toolUseLoopA(
    prompt: string,
    window: TargetWindow,
    system_prompt?: string,
    max_tokens: number = 10000,          // (not always honored by DashScope compatible mode)
    n_last_images: number = 2,           // keep recent screenshot context
    timeout: number = 600000,
    token_limit: number = 1000000,
  ): ChatStatus {
    const chatStatus: ChatStatus = {
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
    const fullSystem = system_prompt?`${system_prompt}\n\n${toolSystem}`:toolSystem;

    // Initial screenshot (scaled/padded by ComputerUseUtils)
    const scaledBase64 = this.getScreenshot(window);

    const messages: QwenChatMessage[] = [
      {
        role: "system",
        content: [{ type: "text", text: fullSystem }],
      },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:image/png;base64,${scaledBase64}` } },
          { type: "text", text: ComputerUseQwen.user_prompt_prefix+"\n\n"+prompt },
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
      const payload: QwenChatPayload = { 
        messages,
        temperature: 0.0,
        top_p: 0.9,
        ...(max_tokens > 0 && { max_tokens })
      };
      let resp = this.queryLlm(payload, chatStatus);

      if (resp?.error) {
        window.Log("Error in Qwen response: " + JSON.stringify(resp.error, null, 2)+" Re-trying.");
        resp = this.queryLlm(payload, chatStatus);
      }

      if (resp?.error) {
        window.Log("Error in Qwen response: " + JSON.stringify(resp.error, null, 2));
        chatStatus.stop_reason = "error_in_response";
        chatStatus.success = false;
        break;
      }

      const assistantText = resp?.choices?.[0]?.message?.content || "";
      // Register for debugging/replay parity with other implementations
      try {
        window.RegisterResponse(payload, resp, chatStatus, this.imgMeta);
      } catch {
        // ignore if older TargetWindow impl differs
      }

      const {calls: toolCalls, text: cleanedText} = this.extractToolCalls(assistantText, resp);
      messages.push({
        role: "assistant",
        content: [{ type: "text", text: cleanedText }],
      });


      if (!toolCalls.length) {
        // No tool calls => treat as completion
        chatStatus.stop_reason = resp?.choices?.[0]?.finish_reason || "end_turn";
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

        let result: ToolResult;
        if (tc.name === "computer_use") {
          result = this.handleComputerUse(window, tc.arguments, chatStatus);
        } else if (
          tc.name === "rapise_assert" ||
          tc.name === "rapise_set_return_value" ||
          tc.name === "rapise_print_message"
        ) {
          result = this.handleRapiseFunction(window, tc.name, tc.arguments);
        } else {
          // Handle cases where the action is passed directly as tool name (legacy compatibility)
          const computerUseActions = [
            "key", "type", "mouse_move", "left_click", "left_click_drag", 
            "right_click", "middle_click", "double_click", "triple_click", 
            "scroll", "hscroll", "wait", "terminate", "answer"
          ];
          
          if (computerUseActions.includes(tc.name)) {
            // Treat the tool name as a computer_use action
            result = this.handleComputerUse(window, { action: tc.name, ...tc.arguments }, chatStatus);
          } else {
            result = new ToolResult({ error: `Unsupported tool name: ${tc.name}` });
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
          const userMessagesWithImages: number[] = [];
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
      } else {
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
  public static toolUseLoop(
    prompt: string,
    window: TargetWindow,
    system_prompt?: string,
    max_tokens: number = 32768,
    history_n: number = 4,           // number of history steps to include
    timeout: number = 600000,
    token_limit: number = 1000000,
  ): ChatStatus {
    const chatStatus: ChatStatus = {
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
    const responses: string[] = [];
    const screenshots: string[] = [];

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
      const previousActions: string[] = [];
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
      const messages: QwenChatMessage[] = [
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
            } else {
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
      } else {
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
      const payload: QwenChatPayload = {
        messages,
        temperature: 0.1,
        ...(max_tokens > 0 && { max_tokens }),
      };

      let resp = this.queryLlm(payload, chatStatus);

      if (resp?.error) {
        window.Log("Error in Qwen response: " + JSON.stringify(resp.error, null, 2) + " Re-trying.");
        resp = this.queryLlm(payload, chatStatus);
      }

      if (resp?.error) {
        window.Log("Error in Qwen response: " + JSON.stringify(resp.error, null, 2));
        chatStatus.stop_reason = "error_in_response";
        chatStatus.success = false;
        break;
      }

      const assistantText = resp?.choices?.[0]?.message?.content || "";

      // Register for debugging
      try {
        window.RegisterResponse(payload, resp, chatStatus, this.imgMeta);
      } catch {
        // ignore if older TargetWindow impl differs
      }

      // Store response in history
      responses.push(assistantText);

      const { calls: toolCalls, text: cleanedText } = this.extractToolCalls(assistantText, resp);

      if (!toolCalls.length) {
        // No tool calls => treat as completion
        chatStatus.stop_reason = resp?.choices?.[0]?.finish_reason || "end_turn";
        chatStatus.success = true;
        break;
      }

      const toolResponses: string[] = [];

      // Execute tool calls
      for (let i = 0; i < toolCalls.length; i++) {
        const tc = toolCalls[i];
        const actionKey = `${tc.name}-${i}`;
        window.ActionStart(actionKey, `Qwen tool: ${tc.name}`);

        toolResponses.push(JSON.stringify(tc));

        let result: ToolResult;
        if (tc.name === "computer_use") {
          result = this.handleComputerUse(window, tc.arguments, chatStatus);
        } else if (
          tc.name === "rapise_assert" ||
          tc.name === "rapise_set_return_value" ||
          tc.name === "rapise_print_message"
        ) {
          result = this.handleRapiseFunction(window, tc.name, tc.arguments);
        } else {
          const computerUseActions = [
            "key", "type", "mouse_move", "left_click", "left_click_drag",
            "right_click", "middle_click", "double_click", "triple_click",
            "scroll", "hscroll", "wait", "terminate", "answer"
          ];

          if (computerUseActions.includes(tc.name)) {
            result = this.handleComputerUse(window, { action: tc.name, ...tc.arguments }, chatStatus);
          } else {
            result = new ToolResult({ error: `Unsupported tool name: ${tc.name}` });
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
      } else {
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
