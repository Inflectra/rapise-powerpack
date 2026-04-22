# WebPageHelper

## Purpose

WebPageHelper is designed to help performing various actions and checks on the currently open web page without needing XPath or pre-learned objects. Its methods are cross-frame and cover the whole visible page contents. While generally slower than exact XPath lookups, it is useful for writing sanity checks and quick validation scenarios.

Elements can be located by: text, title, placeholder, value, name, CSS class, ID, XPath, label (`<label for=>`), or `aria-label`.

## Installation

Install WebPageHelper [public page object](https://rapisedoc.inflectra.com/Guide/pageobjects/) into your test framework using the `Import Public Module` option.

## Actions

| Action | Description |
|--------|-------------|
| `GetFullPageText()` | Returns all visible text on the current page |
| `GetXPathItemsAsList(xpath)` | Returns XPath query results as a multiline string (one item per line) |
| `CheckPageContains(textToFind)` | Returns `true` if page contains the text, `false` otherwise |
| `VerifyPageContains(message, textToFind)` | CheckPageContains + write assertion to report |
| `CheckVisible(objIdXPathLabelText)` | Returns `true` if element is found and displayed |
| `VerifyVisible(message, objIdXPathLabelText)` | CheckVisible + write assertion to report |
| `DoClick(objIdXPathLabelText)` | Find element and click it |
| `DoCtrlClick(objIdXPathLabelText)` | Ctrl+click an element (opens link in new tab) |
| `DoShiftClick(objIdXPathLabelText)` | Shift+click an element (opens link in new window) |
| `DoClickByText(text)` | Find element by its text and click |
| `DoClickByTitle(title)` | Find element by title attribute (tooltip) and click |
| `DoClickByPlaceholder(placeholderText)` | Find element by placeholder and click |
| `DoClickByValue(value)` | Find element by value attribute and click |
| `DoClickByName(name)` | Find element by name attribute and click |
| `DoClickByClassName(className)` | Find element by CSS class name and click |
| `DoClickById(id)` | Find element by ID and click |
| `DoClickByXPath(xpath)` | Find element by XPath and click |
| `DoClickByTextTitlePlaceholder(text)` | Find element by text, title, or placeholder and click (most generic) |
| `DoFileDragAndDrop(elOrXPath, filePath)` | Upload a file using drag-and-drop simulation |
| `DoTripleClick(elOrXPath)` | Triple-click an element (useful for selecting text) |
| `WaitForVisible(objIdXPathLabelText, timeout)` | Wait for element to appear on screen |
| `WaitWhileVisible(objIdXPathLabelText, timeout)` | Wait while element is visible (e.g. progress bars) |

## Element Locator Formats

The `objIdXPathLabelText` parameter accepts:

- Object ID from the repository: `'welcomeObj'`
- XPath: `'//h1'`
- CSS selector: `'css=h1'`
- Label text: `'Username'` (matches `<label for=>` or `aria-label`)
- Element text: `'Welcome to mycorp!'`

## Usage

### JavaScript

```javascript
// Check page contains welcome message
WebPageHelper.VerifyPageContains('Welcome message found', 'Welcome, Friend!');

// Click a button by its visible text
WebPageHelper.DoClickByText('Submit');

// Click using the generic locator (tries text, title, placeholder)
WebPageHelper.DoClickByTextTitlePlaceholder('Login');

// Click by CSS selector
WebPageHelper.DoClick('css=button.primary');

// Ctrl+click to open a link in a new tab
WebPageHelper.DoCtrlClick('//a[@id="details-link"]');

// Shift+click to open a link in a new window
WebPageHelper.DoShiftClick('View Full Report');

// Wait for a confirmation message (up to 60 seconds)
WebPageHelper.WaitForVisible('Operation Succeeded!', 60000);

// Wait for a progress bar to disappear (up to 2 minutes)
WebPageHelper.WaitWhileVisible('Operation in progress, please wait!', 120000);

// Upload a file via drag and drop
WebPageHelper.DoFileDragAndDrop('//div[@class="dropzone"]', 'C:\\files\\report.pdf');

// Get all links on the page as a list
var allLinks = WebPageHelper.GetXPathItemsAsList('//a');
Tester.Message('All links on the page', allLinks);

// Triple-click to select a paragraph
WebPageHelper.DoTripleClick('//h1');
```

### RVL

| Flow | Type | Object | Action | ParamName | ParamValue |
|------|------|--------|--------|-----------|------------|
| | Action | WebPageHelper | VerifyPageContains | message | Welcome message |
| | | | | textToFind | Welcome, Friend! |
| | Action | WebPageHelper | DoClick | objIdXPathLabelText | css=button.primary |
| | Action | WebPageHelper | WaitForVisible | objIdXPathLabelText | Operation Succeeded! |
| | | | | timeout | 60000 |
