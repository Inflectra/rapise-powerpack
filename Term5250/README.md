![Download](https://github.githubassets.com/images/icons/emoji/unicode/23ec.png?v8) [Download Now](https://inflectra.github.io/DownGit/#/home?url=https://github.com/Inflectra/rapise-powerpack/tree/master/Term5250)

# Term 5250

This sample contains a real example of interacting with a green screen terminal through the IBM 5250 terminal emulator using EHLLAPI (Emulator High-Level Language API).

The sample relies on the `Term5250` PageObject that communicates with IBM iAccess Client Solutions or IBM Personal Communications for AS/400. You may [import](https://rapisedoc.inflectra.com/Guide/Frameworks/pageobjects/#importing-page-objects) `Term5250` into your framework to reuse the same functionality for your own purpose.

## Prerequisites

### 1. IBM iAccess Client Solutions (Required)

The terminal emulator must be running before executing tests. The following processes are supported:

- `acslaunch_win-64.exe` - IBM iAccess Client Solutions (64-bit)
- `acslaunch_win-32.exe` - IBM iAccess Client Solutions (32-bit)
- `pcsws.exe` - IBM Personal Communications
- `pcscm.exe` - IBM Personal Communications

### 2. EHLLAPI DLL (Required)

The EHLLAPI library must be installed. The default expected path is:

```
C:\Program Files (x86)\IBM\EHLLAPI\pcshll32.dll
```

If your EHLLAPI DLL is located elsewhere, you can configure the path using:

```javascript
Term5250.SetDllPath("C:\\path\\to\\your\\pcshll32.dll");
```

Alternatively, set the `EHLLAPI_DLL` environment variable to point to the DLL location.

### 3. Active Terminal Session

Before running tests, ensure:

1. IBM iAccess Client Solutions (or IBM Personal Communications) is launched
2. A 5250 terminal session is active and connected to your AS/400 system
3. The session has a short name assigned (default is "A")

## About EHLLAPI

EHLLAPI (Emulator High-Level Language API) is an IBM standard API that allows applications to interact with terminal emulators programmatically. It provides functions for:

- Connecting to and disconnecting from terminal sessions
- Reading screen contents (presentation space)
- Sending keystrokes and text
- Querying cursor position and session status
- Searching for text on screen

## Key Features

The `Term5250` PageObject provides:

- **Screen Reading**: `CopyPS()`, `GetScreenRows()`, `GetTextAt()`
- **Keyboard Input**: `SendKey()`, `SendString()`, `SendStringEnter()`
- **Cursor Control**: `GetCursorPos()`, `SetCursorPos()`, `TypeAt()`
- **Navigation**: `PressF()`, `SelectMenuOption()`, `RunCommand()`
- **Waiting**: `WaitReady()`, `WaitForScreen()`, `EnsureText()`
- **Session Management**: `ConnectPS()`, `DisconnectPS()`, `QuerySessions()`
- **Utilities**: `Screenshot()`, `DumpScreen()`, `Login()`

## Example Usage

```javascript
// Attach to the running terminal emulator
Term5250.FindOrAttach("A", true);

// Wait for login screen and login
Term5250.Login("MYUSER", "MYPASSWORD", "Sign On");

// Navigate using menu options
Term5250.SelectMenuOption("1");

// Type at specific position
Term5250.TypeAt(10, 20, "SOME TEXT");

// Send function key
Term5250.PressF(3);

// Check for expected text
Term5250.EnsureText("Main Menu", 5000, true);

// Take a screenshot
Term5250.Screenshot("Current screen state");

// Disconnect when done
Term5250.DisconnectPS();
```

## Supported Keys

The following keys are supported via `SendKey()` or `SendCommand()`:

- **Function Keys**: F1-F24, PF(1)-PF(24)
- **Navigation**: Enter, Tab, BackTab, PageUp, PageDown, Home, NewLine
- **Editing**: Delete, Insert, EraseEOF, EraseInput, Clear
- **System**: Help, Reset, SysRequest, Attn, PrintScreen
