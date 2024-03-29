# Using PDF in Rapise

> Note: Newer version with similar functionality is available. It uses `pdf.js` instead of legacy TET library. You may find it [here](../PDFTextExtractV2/).

This sample demonstrates one of the ways how to read text from PDF file using Rapise.

Sometimes you need to extract text information from the PDF document (invoice, order, confirmation) generated by your application.

Note, that this function uses well known [PDFLib TET](https://www.pdflib.com/download/tet/) from *PDFlib GmbH* to work with PDF. This library has free option if your documents are less than 10 pages and less than 1mb. Otherwise you may need to purchase a license. The package that you need to download and install is here [TET-5.2-MSWin32-COM.msi](https://www.pdflib.com/binaries/TET/520/TET-5.2-MSWin32-COM.msi).


This test contains two functions in User.js that you may re-use in your test frameworks:


```javascript
function Pdf_GetFullText(/**string*/pdfPath)
```
- returns PDF contents as text that you may use for further processing.
* *pdfPath* path to PDF file


```javascript
function Pdf_EnsureText(/**string*/pdfPath, /**string*/textToFind, /**bool*/bAssert, /**string*/assertionMessage)
```
- check presense of some string in PDF document.
* *pdfPath* path to PDF file
* *textToFind* substring to locate
* *bAssert* - true/false depending on if you want this function to generate report assertion. 
* *assertionMessage* - optional assertion message to include into report.

## Usage Example

![RVL](img/Pdf_Rvl.png)
