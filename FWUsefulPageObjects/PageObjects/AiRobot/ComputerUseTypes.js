"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Codes = exports.Keys = exports.ComputerUseUtils = exports.ToolResult = void 0;
const sharp_1 = __importDefault(require("sharp"));
const deasync_1 = __importDefault(require("deasync"));
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
            base64_image: this.base64_image || other.base64_image, // Keep only the first non-null image
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
exports.ToolResult = ToolResult;
class ComputerUseUtils {
    static getBestTarget(width, height) {
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
    static processImage(buffer) {
        const img = (0, sharp_1.default)(buffer);
        let metadata = undefined;
        img.metadata().then((m) => { metadata = m; });
        while (metadata === undefined) {
            deasync_1.default.runLoopOnce();
        }
        if (!metadata.width || !metadata.height) {
            throw new Error("Image metadata is missing width or height.");
        }
        const { target, scale_factor } = this.getBestTarget(metadata.width, metadata.height);
        let img_scaled = img;
        const metadata_scaled = Object.assign({}, metadata);
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
    static applyScaling(coordinate, scaleFactor) {
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
    static escapeSendKeysSpecialChars(text) {
        // Replace special characters with their escaped versions
        return text
            .replace(/\{/g, "{{}") // Escape { with {{} (literal left brace)
            .replace(/\}/g, "{}}") // Escape } with {}} (literal right brace)
            .replace(/\+/g, "{+}") // Escape + with {+} (literal plus)
            .replace(/\^/g, "{^}") // Escape ^ with {^} (literal caret)
            .replace(/%/g, "{%}"); // Escape % with {%} (literal percent)
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
                .map((key) => keyMap[key] || `{${key}}`) // Map or use {key} in lowercase
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
}
exports.ComputerUseUtils = ComputerUseUtils;
ComputerUseUtils.MAX_SCALING_TARGETS = {
    XGA: { width: 1024, height: 768 }, // 4:3
    WXGA: { width: 1280, height: 800 }, // 16:10
    FWXGA: { width: 1366, height: 768 }, // ~16:9
};
;
;
;
var Keys;
(function (Keys) {
    Keys["Backspace"] = "Backspace";
    Keys["Tab"] = "Tab";
    Keys["Enter"] = "Enter";
    Keys["Shift"] = "Shift";
    Keys["Control"] = "Control";
    Keys["Alt"] = "Alt";
    Keys["Pause"] = "Pause";
    Keys["CapsLock"] = "CapsLock";
    Keys["Escape"] = "Escape";
    Keys["Space"] = " ";
    Keys["PageUp"] = "PageUp";
    Keys["PageDown"] = "PageDown";
    Keys["End"] = "End";
    Keys["Home"] = "Home";
    Keys["ArrowLeft"] = "ArrowLeft";
    Keys["ArrowUp"] = "ArrowUp";
    Keys["ArrowRight"] = "ArrowRight";
    Keys["ArrowDown"] = "ArrowDown";
    Keys["PrintScreen"] = "PrintScreen";
    Keys["Insert"] = "Insert";
    Keys["Delete"] = "Delete";
    Keys["Digit0"] = "0";
    Keys["Digit1"] = "1";
    Keys["Digit2"] = "2";
    Keys["Digit3"] = "3";
    Keys["Digit4"] = "4";
    Keys["Digit5"] = "5";
    Keys["Digit6"] = "6";
    Keys["Digit7"] = "7";
    Keys["Digit8"] = "8";
    Keys["Digit9"] = "9";
    Keys["A"] = "A";
    Keys["B"] = "B";
    Keys["C"] = "C";
    Keys["D"] = "D";
    Keys["E"] = "E";
    Keys["F"] = "F";
    Keys["G"] = "G";
    Keys["H"] = "H";
    Keys["I"] = "I";
    Keys["J"] = "J";
    Keys["K"] = "K";
    Keys["L"] = "L";
    Keys["M"] = "M";
    Keys["N"] = "N";
    Keys["O"] = "O";
    Keys["P"] = "P";
    Keys["Q"] = "Q";
    Keys["R"] = "R";
    Keys["S"] = "S";
    Keys["T"] = "T";
    Keys["U"] = "U";
    Keys["V"] = "V";
    Keys["W"] = "W";
    Keys["X"] = "X";
    Keys["Y"] = "Y";
    Keys["Z"] = "Z";
    Keys["a"] = "a";
    Keys["b"] = "b";
    Keys["c"] = "c";
    Keys["d"] = "d";
    Keys["e"] = "e";
    Keys["f"] = "f";
    Keys["g"] = "g";
    Keys["h"] = "h";
    Keys["i"] = "i";
    Keys["j"] = "j";
    Keys["k"] = "k";
    Keys["l"] = "l";
    Keys["m"] = "m";
    Keys["n"] = "n";
    Keys["o"] = "o";
    Keys["p"] = "p";
    Keys["q"] = "q";
    Keys["r"] = "r";
    Keys["s"] = "s";
    Keys["t"] = "t";
    Keys["u"] = "u";
    Keys["v"] = "v";
    Keys["w"] = "w";
    Keys["x"] = "x";
    Keys["y"] = "y";
    Keys["z"] = "z";
    Keys["Meta"] = "Meta";
    Keys["ContextMenu"] = "ContextMenu";
    Keys["AudioVolumeMute"] = "AudioVolumeMute";
    Keys["AudioVolumeDown"] = "AudioVolumeDown";
    Keys["AudioVolumeUp"] = "AudioVolumeUp";
    Keys["F1"] = "F1";
    Keys["F2"] = "F2";
    Keys["F3"] = "F3";
    Keys["F4"] = "F4";
    Keys["F5"] = "F5";
    Keys["F6"] = "F6";
    Keys["F7"] = "F7";
    Keys["F8"] = "F8";
    Keys["F9"] = "F9";
    Keys["F10"] = "F10";
    Keys["F11"] = "F11";
    Keys["F12"] = "F12";
    Keys["NumLock"] = "NumLock";
    Keys["ScrollLock"] = "ScrollLock";
    Keys["Semicolon"] = ";";
    Keys["Equal"] = "=";
    Keys["Comma"] = ",";
    Keys["Minus"] = "-";
    Keys["Period"] = ".";
    Keys["Slash"] = "/";
    Keys["Backquote"] = "`";
    Keys["BracketLeft"] = "[";
    Keys["Backslash"] = "\\";
    Keys["BracketRight"] = "]";
    Keys["Quote"] = "'";
    Keys["Tilde"] = "~";
    Keys["Exclamation"] = "!";
    Keys["At"] = "@";
    Keys["Sharp"] = "#";
    Keys["Dollar"] = "$";
    Keys["Percent"] = "%";
    Keys["Caret"] = "^";
    Keys["Ampersand"] = "&";
    Keys["Asterisk"] = "*";
    Keys["ParenthesisLeft"] = "(";
    Keys["ParenthesisRight"] = ")";
    Keys["Underscore"] = "_";
    Keys["Plus"] = "+";
    Keys["OpenBrace"] = "{";
    Keys["CloseBrace"] = "}";
    Keys["Pipe"] = "|";
    Keys["Colon"] = ":";
    Keys["Quote2"] = "\"";
    Keys["AngleBracketLeft"] = "<";
    Keys["AngleBracketRight"] = ">";
    Keys["QuestionMark"] = "?";
})(Keys || (exports.Keys = Keys = {}));
/**
 * Codes for KeyboardEvent.code
 */
var Codes;
(function (Codes) {
    Codes["Backspace"] = "Backspace";
    Codes["Tab"] = "Tab";
    Codes["Enter"] = "Enter";
    Codes["ShiftLeft"] = "ShiftLeft";
    Codes["ShiftRight"] = "ShiftRight";
    Codes["ControlLeft"] = "ControlLeft";
    Codes["ControlRight"] = "ControlRight";
    Codes["AltLeft"] = "AltLeft";
    Codes["AltRight"] = "AltRight";
    Codes["Pause"] = "Pause";
    Codes["CapsLock"] = "CapsLock";
    Codes["Escape"] = "Escape";
    Codes["Space"] = "Space";
    Codes["PageUp"] = "PageUp";
    Codes["PageDown"] = "PageDown";
    Codes["End"] = "End";
    Codes["Home"] = "Home";
    Codes["ArrowLeft"] = "ArrowLeft";
    Codes["ArrowUp"] = "ArrowUp";
    Codes["ArrowRight"] = "ArrowRight";
    Codes["ArrowDown"] = "ArrowDown";
    Codes["PrintScreen"] = "PrintScreen";
    Codes["Insert"] = "Insert";
    Codes["Delete"] = "Delete";
    Codes["Digit0"] = "Digit0";
    Codes["Digit1"] = "Digit1";
    Codes["Digit2"] = "Digit2";
    Codes["Digit3"] = "Digit3";
    Codes["Digit4"] = "Digit4";
    Codes["Digit5"] = "Digit5";
    Codes["Digit6"] = "Digit6";
    Codes["Digit7"] = "Digit7";
    Codes["Digit8"] = "Digit8";
    Codes["Digit9"] = "Digit9";
    Codes["AudioVolumeMute"] = "AudioVolumeMute";
    Codes["AudioVolumeDown"] = "AudioVolumeDown";
    Codes["AudioVolumeUp"] = "AudioVolumeUp";
    Codes["KeyA"] = "KeyA";
    Codes["KeyB"] = "KeyB";
    Codes["KeyC"] = "KeyC";
    Codes["KeyD"] = "KeyD";
    Codes["KeyE"] = "KeyE";
    Codes["KeyF"] = "KeyF";
    Codes["KeyG"] = "KeyG";
    Codes["KeyH"] = "KeyH";
    Codes["KeyI"] = "KeyI";
    Codes["KeyJ"] = "KeyJ";
    Codes["KeyK"] = "KeyK";
    Codes["KeyL"] = "KeyL";
    Codes["KeyM"] = "KeyM";
    Codes["KeyN"] = "KeyN";
    Codes["KeyO"] = "KeyO";
    Codes["KeyP"] = "KeyP";
    Codes["KeyQ"] = "KeyQ";
    Codes["KeyR"] = "KeyR";
    Codes["KeyS"] = "KeyS";
    Codes["KeyT"] = "KeyT";
    Codes["KeyU"] = "KeyU";
    Codes["KeyV"] = "KeyV";
    Codes["KeyW"] = "KeyW";
    Codes["KeyX"] = "KeyX";
    Codes["KeyY"] = "KeyY";
    Codes["KeyZ"] = "KeyZ";
    Codes["MetaLeft"] = "MetaLeft";
    Codes["MetaRight"] = "MetaRight";
    Codes["ContextMenu"] = "ContextMenu";
    Codes["Numpad0"] = "Numpad0";
    Codes["Numpad1"] = "Numpad1";
    Codes["Numpad2"] = "Numpad2";
    Codes["Numpad3"] = "Numpad3";
    Codes["Numpad4"] = "Numpad4";
    Codes["Numpad5"] = "Numpad5";
    Codes["Numpad6"] = "Numpad6";
    Codes["Numpad7"] = "Numpad7";
    Codes["Numpad8"] = "Numpad8";
    Codes["Numpad9"] = "Numpad9";
    Codes["NumpadMultiply"] = "NumpadMultiply";
    Codes["NumpadAdd"] = "NumpadAdd";
    Codes["NumpadSubtract"] = "NumpadSubtract";
    Codes["NumpadDecimal"] = "NumpadDecimal";
    Codes["NumpadDivide"] = "NumpadDivide";
    Codes["F1"] = "F1";
    Codes["F2"] = "F2";
    Codes["F3"] = "F3";
    Codes["F4"] = "F4";
    Codes["F5"] = "F5";
    Codes["F6"] = "F6";
    Codes["F7"] = "F7";
    Codes["F8"] = "F8";
    Codes["F9"] = "F9";
    Codes["F10"] = "F10";
    Codes["F11"] = "F11";
    Codes["F12"] = "F12";
    Codes["NumLock"] = "NumLock";
    Codes["ScrollLock"] = "ScrollLock";
    Codes["Semicolon"] = "Semicolon";
    Codes["Equal"] = "Equal";
    Codes["Comma"] = "Comma";
    Codes["Minus"] = "Minus";
    Codes["Period"] = "Period";
    Codes["Slash"] = "Slash";
    Codes["Backquote"] = "Backquote";
    Codes["BracketLeft"] = "BracketLeft";
    Codes["Backslash"] = "Backslash";
    Codes["BracketRight"] = "BracketRight";
    Codes["Quote"] = "Quote";
})(Codes || (exports.Codes = Codes = {}));
//# sourceMappingURL=ComputerUseTypes.js.map