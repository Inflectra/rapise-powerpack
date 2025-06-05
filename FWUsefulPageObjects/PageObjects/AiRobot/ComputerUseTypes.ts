import sharp from 'sharp';
import deasync from 'deasync';

export interface TargetWindow {
    target: string;
    
    // Mouse Actions
    DoMouseMove(x: number, y: number): void; // Move the mouse to a specific coordinate
    DoClick(clickType: "L" | "R" | "M" | "LD"): void; // Perform left, right, middle, or double click
    DoMouseDragTo(x: number, y: number): void; // Drag the mouse to a specific coordinate

    DoMousePress(button: "L" | "R" | "M"): void; // Press and hold a mouse button
    DoMouseRelease(button: "L" | "R" | "M"): void; // Release a mouse button

    DoScroll(scrollX: number, scrollY: number): void; // Scroll in a specific direction by a certain amount

    // Keyboard Actions
    DoSendKeys(keys: string, duration?: number): void; // Simulate typing or key presses

    // Screen-Related Actions
    GetScreenshot(): string; // Capture and return a Base64-encoded screenshot
    GetCursorPosition(): { x: number; y: number }; // Retrieve the current cursor position

    // Logging and Reporting
    Log(message: string, level?: number): void; // Log a general-purpose message
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

export class ToolResult {
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

// Interfaces for image processing
export interface Dimensions {
    width: number;
    height: number;
}

export interface ScalingTarget {
    target: Dimensions;
    scale_factor: number;
}

export interface ProcessImageResult {
    img: sharp.Sharp; // The original Sharp image object
    img_scaled: sharp.Sharp; // The scaled Sharp image object
    scale_factor: number; // The scaling factor used for resizing
    metadata: sharp.Metadata; // Metadata of the original image
    metadata_scaled: sharp.Metadata; // Metadata of the scaled image
}

export class ComputerUseUtils {

    static MAX_SCALING_TARGETS: Record<string, Dimensions> = {
        XGA: { width: 1024, height: 768 }, // 4:3
        WXGA: { width: 1280, height: 800 }, // 16:10
        FWXGA: { width: 1366, height: 768 }, // ~16:9
    };

    static getBestTarget(width: number, height: number): ScalingTarget {
        // Define minimum target size (XGA: 1024x768)
        const minTarget = this.MAX_SCALING_TARGETS.XGA;

        // Check if the image is smaller than the minimum target size
        if (width < minTarget.width || height < minTarget.height) {
            // For smaller images, we'll keep the original size and add padding later
            return {
                target: minTarget,
                scale_factor: 1 // No scaling, we'll pad instead
            };
        }

        // For images larger than or equal to minimum target size, use the original logic
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

    static processImage(buffer: Buffer): ProcessImageResult {
        const img = sharp(buffer);
        let metadata: sharp.Metadata | undefined = undefined;
        img.metadata().then((m) => { metadata = m; });
        while (metadata === undefined) {
            deasync.runLoopOnce();
        }

        if (!metadata.width || !metadata.height) {
            throw new Error("Image metadata is missing width or height.");
        }

        const { target, scale_factor } = this.getBestTarget(metadata.width, metadata.height);

        let img_scaled = img;
        const metadata_scaled: sharp.Metadata = { ...metadata };

        // If the image is smaller than the minimum target size (1024x768), add black padding
        if (scale_factor == 1 && metadata.width <= target.width && metadata.height <= target.height) {
            // Keep the original image in the top-left corner and add black padding
            metadata_scaled.width = target.width;
            metadata_scaled.height = target.height;

            img_scaled = img.extend({
                top: 0,
                bottom: target.height - metadata.height,
                left: 0,
                right: target.width - metadata.width,
                background: { r: 0, g: 0, b: 0, alpha: 1 } // Black background
            });
        }
        // If the image is larger than the target size, scale it down
        else if (scale_factor < 1) {
            // Calculate the scaled dimensions
            const scaledWidth = Math.round(metadata.width * scale_factor);
            const scaledHeight = Math.round(metadata.height * scale_factor);

            // First resize the image
            img_scaled = img.resize({
                width: scaledWidth,
                height: scaledHeight,
            });

            // Then extend it to match the target dimensions and fill with black background
            img_scaled = img_scaled.extend({
                top: 0,
                bottom: target.height - scaledHeight,
                left: 0,
                right: target.width - scaledWidth,
                background: { r: 0, g: 0, b: 0, alpha: 1 } // Black background
            });

            // Update metadata to reflect the final dimensions (target dimensions)
            metadata_scaled.width = target.width;
            metadata_scaled.height = target.height;
        }

        return { img, img_scaled, scale_factor, metadata, metadata_scaled };
    }

    static applyScaling(coordinate: [number, number], scaleFactor: number): [number, number] {
        const physicalX = Math.round(coordinate[0] / scaleFactor);
        const physicalY = Math.round(coordinate[1] / scaleFactor);
        return [physicalX, physicalY];
    }

    /**
 * Escapes special characters in SendKeys syntax
 * Special characters: + (shift), ^ (ctrl), % (alt), { and } (braces)
 * @param text The text to escape
 * @returns The escaped text
 */
    static escapeSendKeysSpecialChars(text: string): string {
        // Replace special characters with their escaped versions
        return text
            .replace(/\{/g, "{{}") // Escape { with {{} (literal left brace)
            .replace(/\}/g, "{}}") // Escape } with {}} (literal right brace)
            .replace(/\+/g, "{+}") // Escape + with {+} (literal plus)
            .replace(/\^/g, "{^}") // Escape ^ with {^} (literal caret)
            .replace(/%/g, "{%}"); // Escape % with {%} (literal percent)
    }

    static convertToSendKeys(xdtoolKey: string): string {
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
}


// Interfaces for external objects
export interface Tester {
    Assert(description: string, condition: boolean, attachments: any[]): void;
    Message(message: string): void;
}

export interface TGlobal {
    DoSleep: (milliseconds: number) => void;
};

export interface TAiServerClient {
    QueryRaw(payload: any, options: any): any;
};

export interface TWebDriver {
    GetScreenshotIW(): Screenshot;
};

export interface Screenshot {
    ToBase64Bitmap(): string;
}

export interface SeSReportImage {
    new(image: Screenshot): SeSReportImage;
}

export enum Keys {
    Backspace = "Backspace",
    Tab = "Tab",
    Enter = "Enter",
    Shift = "Shift",
    Control = "Control",
    Alt = "Alt",
    Pause = "Pause",
    CapsLock = "CapsLock",
    Escape = "Escape",
    Space = " ",
    PageUp = "PageUp",
    PageDown = "PageDown",
    End = "End",
    Home = "Home",
    ArrowLeft = "ArrowLeft",
    ArrowUp = "ArrowUp",
    ArrowRight = "ArrowRight",
    ArrowDown = "ArrowDown",
    PrintScreen = "PrintScreen",
    Insert = "Insert",
    Delete = "Delete",
    Digit0 = "0",
    Digit1 = "1",
    Digit2 = "2",
    Digit3 = "3",
    Digit4 = "4",
    Digit5 = "5",
    Digit6 = "6",
    Digit7 = "7",
    Digit8 = "8",
    Digit9 = "9",
    A = "A",
    B = "B",
    C = "C",
    D = "D",
    E = "E",
    F = "F",
    G = "G",
    H = "H",
    I = "I",
    J = "J",
    K = "K",
    L = "L",
    M = "M",
    N = "N",
    O = "O",
    P = "P",
    Q = "Q",
    R = "R",
    S = "S",
    T = "T",
    U = "U",
    V = "V",
    W = "W",
    X = "X",
    Y = "Y",
    Z = "Z",
    a = "a",
    b = "b",
    c = "c",
    d = "d",
    e = "e",
    f = "f",
    g = "g",
    h = "h",
    i = "i",
    j = "j",
    k = "k",
    l = "l",
    m = "m",
    n = "n",
    o = "o",
    p = "p",
    q = "q",
    r = "r",
    s = "s",
    t = "t",
    u = "u",
    v = "v",
    w = "w",
    x = "x",
    y = "y",
    z = "z",
    Meta = "Meta",
    ContextMenu = "ContextMenu",
    AudioVolumeMute = "AudioVolumeMute",
    AudioVolumeDown = "AudioVolumeDown",
    AudioVolumeUp = "AudioVolumeUp",
    F1 = "F1",
    F2 = "F2",
    F3 = "F3",
    F4 = "F4",
    F5 = "F5",
    F6 = "F6",
    F7 = "F7",
    F8 = "F8",
    F9 = "F9",
    F10 = "F10",
    F11 = "F11",
    F12 = "F12",
    NumLock = "NumLock",
    ScrollLock = "ScrollLock",
    Semicolon = ";",
    Equal = "=",
    Comma = ",",
    Minus = "-",
    Period = ".",
    Slash = "/",
    Backquote = "`",
    BracketLeft = "[",
    Backslash = "\\",
    BracketRight = "]",
    Quote = "'",
    Tilde = "~",
    Exclamation = "!",
    At = "@",
    Sharp = "#",
    Dollar = "$",
    Percent = "%",
    Caret = "^",
    Ampersand = "&",
    Asterisk = "*",
    ParenthesisLeft = "(",
    ParenthesisRight = ")",
    Underscore = "_",
    Plus = "+",
    OpenBrace = "{",
    CloseBrace = "}",
    Pipe = "|",
    Colon = ":",
    Quote2 = '"',
    AngleBracketLeft = "<",
    AngleBracketRight = ">",
    QuestionMark = "?"
}

/**
 * Codes for KeyboardEvent.code
 */
export enum Codes {
    Backspace = "Backspace",
    Tab = "Tab",
    Enter = "Enter",
    ShiftLeft = "ShiftLeft",
    ShiftRight = "ShiftRight",
    ControlLeft = "ControlLeft",
    ControlRight = "ControlRight",
    AltLeft = "AltLeft",
    AltRight = "AltRight",
    Pause = "Pause",
    CapsLock = "CapsLock",
    Escape = "Escape",
    Space = "Space",
    PageUp = "PageUp",
    PageDown = "PageDown",
    End = "End",
    Home = "Home",
    ArrowLeft = "ArrowLeft",
    ArrowUp = "ArrowUp",
    ArrowRight = "ArrowRight",
    ArrowDown = "ArrowDown",
    PrintScreen = "PrintScreen",
    Insert = "Insert",
    Delete = "Delete",
    Digit0 = "Digit0",
    Digit1 = "Digit1",
    Digit2 = "Digit2",
    Digit3 = "Digit3",
    Digit4 = "Digit4",
    Digit5 = "Digit5",
    Digit6 = "Digit6",
    Digit7 = "Digit7",
    Digit8 = "Digit8",
    Digit9 = "Digit9",
    AudioVolumeMute = "AudioVolumeMute",
    AudioVolumeDown = "AudioVolumeDown",
    AudioVolumeUp = "AudioVolumeUp",
    KeyA = "KeyA",
    KeyB = "KeyB",
    KeyC = "KeyC",
    KeyD = "KeyD",
    KeyE = "KeyE",
    KeyF = "KeyF",
    KeyG = "KeyG",
    KeyH = "KeyH",
    KeyI = "KeyI",
    KeyJ = "KeyJ",
    KeyK = "KeyK",
    KeyL = "KeyL",
    KeyM = "KeyM",
    KeyN = "KeyN",
    KeyO = "KeyO",
    KeyP = "KeyP",
    KeyQ = "KeyQ",
    KeyR = "KeyR",
    KeyS = "KeyS",
    KeyT = "KeyT",
    KeyU = "KeyU",
    KeyV = "KeyV",
    KeyW = "KeyW",
    KeyX = "KeyX",
    KeyY = "KeyY",
    KeyZ = "KeyZ",
    MetaLeft = "MetaLeft",
    MetaRight = "MetaRight",
    ContextMenu = "ContextMenu",
    Numpad0 = "Numpad0",
    Numpad1 = "Numpad1",
    Numpad2 = "Numpad2",
    Numpad3 = "Numpad3",
    Numpad4 = "Numpad4",
    Numpad5 = "Numpad5",
    Numpad6 = "Numpad6",
    Numpad7 = "Numpad7",
    Numpad8 = "Numpad8",
    Numpad9 = "Numpad9",
    NumpadMultiply = "NumpadMultiply",
    NumpadAdd = "NumpadAdd",
    NumpadSubtract = "NumpadSubtract",
    NumpadDecimal = "NumpadDecimal",
    NumpadDivide = "NumpadDivide",
    F1 = "F1",
    F2 = "F2",
    F3 = "F3",
    F4 = "F4",
    F5 = "F5",
    F6 = "F6",
    F7 = "F7",
    F8 = "F8",
    F9 = "F9",
    F10 = "F10",
    F11 = "F11",
    F12 = "F12",
    NumLock = "NumLock",
    ScrollLock = "ScrollLock",
    Semicolon = "Semicolon",
    Equal = "Equal",
    Comma = "Comma",
    Minus = "Minus",
    Period = "Period",
    Slash = "Slash",
    Backquote = "Backquote",
    BracketLeft = "BracketLeft",
    Backslash = "Backslash",
    BracketRight = "BracketRight",
    Quote = "Quote"
}