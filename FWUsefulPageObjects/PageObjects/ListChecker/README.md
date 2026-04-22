# ListChecker

## Purpose

ListChecker helps comparing multiline strings with lists and dropdowns. Expected list may be an array or a multiline string. It can compare against application data, variables, or dropdown definitions from a `Dropdowns.xlsx` spreadsheet.

## Installation

Install ListChecker [public page object](https://rapisedoc.inflectra.com/Guide/pageobjects/) into your test framework using the `Import Public Module` option.

## Actions

| Action | Description |
|--------|-------------|
| `VerifyMenu(menuContents, expected)` | Verify that `menuContents` has all lines/items from `expected` and nothing else |
| `VerifyMenuContains(menuContents, expected)` | Verify that `menuContents` has all lines/items from `expected` (may have extra items) |
| `CompareToDropdown(idList, menuContents)` | Check that dropdown defined in `Dropdowns.xlsx` by `idList` equals `menuContents` |
| `GetDropdownList(idList, xlsPath)` | Return values of dropdown with id `idList` as an array of strings |

## Parameters

### VerifyMenu / VerifyMenuContains

- `menuContents` (string) — actual multiline string (e.g. from a dropdown or list control)
- `expected` (string or string[]) — expected items as an array or newline-separated string

### CompareToDropdown

- `idList` (string) — column ID in `Dropdowns.xlsx`
- `menuContents` (string) — actual multiline string to compare against

### GetDropdownList

- `idList` (string) — column ID in the spreadsheet
- `xlsPath` (string, optional) — path to the spreadsheet, defaults to `Dropdowns.xlsx`

## Usage

### JavaScript

```javascript
// Get text from a dropdown and verify it matches expected items exactly
var menuText = SeS('MyDropdown').GetInnerText();
ListChecker.VerifyMenu(menuText, "Option A\nOption B\nOption C");

// Verify dropdown contains at least these items (may have more)
ListChecker.VerifyMenuContains(menuText, ["Option A", "Option C"]);

// Compare against a dropdown list defined in Dropdowns.xlsx
ListChecker.CompareToDropdown("StatusValues", menuText);

// Get dropdown values as array for custom processing
var items = ListChecker.GetDropdownList("StatusValues");
Tester.Message("First item: " + items[0]);
```

### RVL

| Flow | Type | Object | Action | ParamName | ParamValue |
|------|------|--------|--------|-----------|------------|
| | Action | ListChecker | VerifyMenu | menuContents | Option A\nOption B |
| | | | | expected | Option A\nOption B |
| | Action | ListChecker | CompareToDropdown | idList | StatusValues |
| | | | | menuContents | Option A\nOption B |
