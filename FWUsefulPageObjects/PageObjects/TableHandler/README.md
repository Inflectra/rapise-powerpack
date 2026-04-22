# TableHandler

## Purpose

TableHandler makes it easy to work with HTML `<table>` based tables. It provides methods to count rows, click cells by row text and column name, and verify row contents.

## Installation

Install TableHandler [public page object](https://rapisedoc.inflectra.com/Guide/pageobjects/) into your test framework using the `Import Public Module` option.

## Actions

| Action | Description |
|--------|-------------|
| `GetRowCount()` | Get the number of `<tr>` rows in the table |
| `DoClickCell(rowText, colId)` | Find a row containing `rowText` and click the cell in column `colId` |
| `VerifyRow(rowText, otherText)` | Find a row containing `rowText` and verify it also contains `otherText` |

## Parameters

### DoClickCell

- `rowText` (string) — text to find in a row
- `colId` (string) — column header caption for the cell to click. If the cell contains a link, the link is clicked.

### VerifyRow

- `rowText` (string) — text to find in a row
- `otherText` (string) — additional text expected in the same row

## Usage

### JavaScript

```javascript
// Get total number of rows
var count = TableHandler.GetRowCount();
Tester.Message("Table has " + count + " rows");

// Click the "Edit" link in the row containing "Saturday"
TableHandler.DoClickCell("Saturday", "Edit");

// Verify that the row with "Saturday" also contains "Contemporary Fiction"
TableHandler.VerifyRow("Saturday", "Contemporary Fiction");
```

### RVL

| Flow | Type | Object | Action | ParamName | ParamValue |
|------|------|--------|--------|-----------|------------|
| | Action | TableHandler | DoClickCell | rowText | Saturday |
| | | | | colId | Edit |
| | Action | TableHandler | VerifyRow | rowText | Saturday |
| | | | | otherText | Contemporary Fiction |
