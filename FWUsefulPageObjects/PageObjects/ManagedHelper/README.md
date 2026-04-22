# ManagedHelper

## Purpose

ManagedHelper provides handy methods for working with popup dialogs and context menus in Managed (.NET WinForms) applications. It can:

- Wait for popup dialogs to appear
- Press buttons in modal dialogs
- Click context menu items
- Return context menu contents as a list

## Installation

Install ManagedHelper [public page object](https://rapisedoc.inflectra.com/Guide/pageobjects/) into your test framework using the `Import Public Module` option.

## Actions

| Action | Description |
|--------|-------------|
| `PressModalButton(buttonCaption, dialogCaption)` | Find and press a button in a modal dialog |
| `FindModalDialog(dialogCaption, pid)` | Find a modal Managed dialog with given title |
| `ContextMenuSelect(path)` | Click a context menu item by path, or return full menu contents if path is empty |
| `GetContextMenuObject()` | Return the ManagedObject representing the currently visible context menu |
| `WaitForPopup(caption, timeout)` | Wait for a managed popup window with given caption to appear |

## Parameters

### PressModalButton

- `buttonCaption` (string) — button text, e.g. `"OK"`, `"Cancel"`, `"Close"` (default: `"Close"`)
- `dialogCaption` (string) — dialog title to search for

### FindModalDialog

- `dialogCaption` (string) — caption to look for (supports `regex:` prefix)
- `pid` (number, optional) — PID of the application to limit the search

### ContextMenuSelect

- `path` (string, optional) — menu item path to click. When omitted, returns full menu contents as a list.

### WaitForPopup

- `caption` (string) — popup window caption to wait for
- `timeout` (number) — maximum wait time in milliseconds (default: 10000)

## Usage

### JavaScript

```javascript
// Wait for a confirmation dialog and press OK
ManagedHelper.WaitForPopup("Confirm Delete", 5000);
ManagedHelper.PressModalButton("OK", "Confirm Delete");

// Right-click an element and select a context menu item
SeS('TreeNode').DoRClick();
ManagedHelper.ContextMenuSelect("Edit|Properties");

// Get all context menu items as a list
SeS('TreeNode').DoRClick();
var menuItems = ManagedHelper.ContextMenuSelect();
Tester.Message("Menu contents", menuItems);

// Find a modal dialog by regex pattern
var dialog = ManagedHelper.FindModalDialog("regex:Error.*");
```

### RVL

| Flow | Type | Object | Action | ParamName | ParamValue |
|------|------|--------|--------|-----------|------------|
| | Action | ManagedHelper | WaitForPopup | caption | Confirm Delete |
| | | | | timeout | 5000 |
| | Action | ManagedHelper | PressModalButton | buttonCaption | OK |
| | | | | dialogCaption | Confirm Delete |
