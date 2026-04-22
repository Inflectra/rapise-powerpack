# PDF

## Purpose

PDF module provides PDF handling capabilities: read text from PDF files, check if a PDF contains specific text, and write assertions to the test report. It supports three text extraction methods:

- **text** (default) — extracts text from PDFs that have an explicit text layer
- **ai** — uses AI as an OCR engine (requires AiTester / inflectra.ai)
- **ocr** — uses the built-in Windows OCR engine

## Installation

Install PDF [public page object](https://rapisedoc.inflectra.com/Guide/pageobjects/) into your test framework using the `Import Public Module` option.

## Actions

| Action | Description |
|--------|-------------|
| `GetFullText(pdfPath, method)` | Parse PDF and return its full text content |
| `Contains(pdfPath, textOrRegexp)` | Check if PDF contains given text or regex pattern |
| `AssertContains(assertionMessage, pdfPath, textOrRegexp)` | Contains + write assertion to report |
| `SetPerferredMethod(method)` | Set default extraction method (`text`, `ai`, or `ocr`). Returns previous method. |

## Parameters

### GetFullText

- `pdfPath` (string) — path to the PDF file (absolute or relative)
- `method` (string, optional) — extraction method: `text`, `ai`, or `ocr`. Defaults to `text`.

### Contains

- `pdfPath` (string) — path to the PDF file
- `textOrRegexp` (string) — plain text or `regex:` prefixed pattern to search for

### AssertContains

- `assertionMessage` (string) — message to write to the report
- `pdfPath` (string) — path to the PDF file
- `textOrRegexp` (string) — plain text or `regex:` prefixed pattern to search for

### SetPerferredMethod

- `method` (string) — `text`, `ai`, or `ocr`

## Usage

### JavaScript

```javascript
// Get full text from a PDF
var text = PDF.GetFullText("report.pdf");
Tester.Message("PDF contents", text);

// Check if PDF contains specific text
if (PDF.Contains("report.pdf", "Total Revenue")) {
    Tester.Message("Revenue section found");
}

// Assert PDF contains a regex pattern
PDF.AssertContains("Invoice number present", "invoice.pdf", "regex:INV-\\d{6}");

// Use AI-based OCR for scanned PDFs
PDF.SetPerferredMethod("ai");
var scannedText = PDF.GetFullText("scanned_document.pdf");

// Or specify method per call
var text = PDF.GetFullText("scanned_document.pdf", "ocr");
```

### RVL

| Flow | Type | Object | Action | ParamName | ParamValue |
|------|------|--------|--------|-----------|------------|
| | Action | PDF | AssertContains | assertionMessage | Invoice number present |
| | | | | pdfPath | invoice.pdf |
| | | | | textOrRegexp | regex:INV-\\d{6} |
| | Action | PDF | SetPerferredMethod | method | ai |
| | Action | PDF | GetFullText | pdfPath | scanned_document.pdf |
