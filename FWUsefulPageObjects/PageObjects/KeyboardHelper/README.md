# KeyboardHelper Public Page Object

## Purpose

KeyboardHelper provides a handy way for pressing and releasing modifier keys (Alt, Ctrl, Shift, Win). This is useful when you need to hold a modifier key while performing other actions during test automation.

## Installation

Install KeyboardHelper [public page object](https://rapisedoc.inflectra.com/Guide/pageobjects/) into your test framework using the `Import Public Module` option.

## Actions

| Action | Description |
|--------|-------------|
| `PressAlt` | Press and hold the Alt key |
| `ReleaseAlt` | Release the Alt key |
| `PressCtrl` | Press and hold the Ctrl key |
| `ReleaseCtrl` | Release the Ctrl key |
| `PressShift` | Press and hold the Shift key |
| `ReleaseShift` | Release the Shift key |
| `PressWin` | Press and hold the Windows key |
| `ReleaseWin` | Release the Windows key |

## Usage

### JavaScript

```javascript
// Hold Ctrl, click an element, then release Ctrl (multi-select scenario)
KeyboardHelper.PressCtrl();
SeS('ListItem1').DoClick();
SeS('ListItem3').DoClick();
KeyboardHelper.ReleaseCtrl();

// Press Alt+F4 to close a window
KeyboardHelper.PressAlt();
Global.DoSendKeys('{F4}');
KeyboardHelper.ReleaseAlt();

// Shift+Click for range selection
KeyboardHelper.PressShift();
SeS('ListItem5').DoClick();
KeyboardHelper.ReleaseShift();
```

### RVL

| Flow | Type | Object | Action | ParamName | ParamValue |
|------|------|--------|--------|-----------|------------|
| | Action | KeyboardHelper | PressCtrl | | |
| | Action | ListItem1 | DoClick | | |
| | Action | ListItem3 | DoClick | | |
| | Action | KeyboardHelper | ReleaseCtrl | | |
