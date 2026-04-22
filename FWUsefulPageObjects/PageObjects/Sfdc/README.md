# Sfdc

## Purpose

Sfdc (Salesforce) module provides common actions for automating Salesforce Lightning applications: launching the app, navigating modules, working with list views, filling forms, and interacting with standard Salesforce UI elements.

Configuration values (`SfdcUrl`, `UserName`, `Password`) are read from `%WORKDIR%\Shared\Config.xlsx`.

## Installation

Install Sfdc [public page object](https://rapisedoc.inflectra.com/Guide/pageobjects/) into your test framework using the `Import Public Module` option.

## Actions

| Action | Description |
|--------|-------------|
| `Launch()` | Launch Salesforce in a browser using credentials from Config.xlsx |
| `OpenApp(app)` | Open a Salesforce application (e.g. Service, Marketing, Sales) |
| `NavigateModule(module)` | Navigate to a module using the nav bar (e.g. Leads, Contacts) |
| `SelectListView(view)` | Select a list view (e.g. Recently Viewed, All Open Leads) |
| `ClickButton(name)` | Click a button by its name |
| `SetTextField(name, value)` | Set text into a form field by name or placeholder |
| `SearchTable(value)` | Search data in a table using the search input |
| `SelectComboboxItem(name, item)` | Select an item from a Lightning combobox |
| `SaveDom()` | Save the DOM tree of the current page to `dom.xml` |

## Helper Functions

| Function | Description |
|----------|-------------|
| `LoginSfdc(url, userName, password)` | Navigate to URL and perform login |
| `UploadFile(path)` | Upload a file using a file input |
| `SetOutputValue(key, value)` | Write key/value pair to `Output.xlsx` |
| `GetOutputValue(key, defValue)` | Read value from `Output.xlsx` |

## Usage

### JavaScript

```javascript
// Launch Salesforce (reads credentials from Config.xlsx)
Sfdc.Launch();

// Open the Sales application
Sfdc.OpenApp("Sales");

// Navigate to Leads module
Sfdc.NavigateModule("Leads");

// Select a list view
Sfdc.SelectListView("All Open Leads");

// Search in a table
Sfdc.SearchTable("Acme Corp");

// Fill a form field
Sfdc.SetTextField("Company", "Acme Corporation");

// Select from a combobox
Sfdc.SelectComboboxItem("Lead Status", "Working - Contacted");

// Click a button
Sfdc.ClickButton("Save");
```

### RVL

| Flow | Type | Object | Action | ParamName | ParamValue |
|------|------|--------|--------|-----------|------------|
| | Action | Sfdc | Launch | | |
| | Action | Sfdc | OpenApp | app | Sales |
| | Action | Sfdc | NavigateModule | module | Leads |
| | Action | Sfdc | SelectListView | view | All Open Leads |
| | Action | Sfdc | SetTextField | name | Company |
| | | | | value | Acme Corporation |
| | Action | Sfdc | ClickButton | name | Save |
