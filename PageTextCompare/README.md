![Download](https://github.githubassets.com/images/icons/emoji/unicode/23ec.png?v8) [Download Now](https://inflectra.github.io/DownGit/#/home?url=https://github.com/Inflectra/rapise-powerpack/tree/master/PageTextCompare)

# Comparing Web Page Content to Text or MSWord File

This sample contains two useful functions.

Compare contents of the currently open web page with reference file in plain text format:
```javascript
function ComparePageToTextFile(refTextPath)
```

Compare contents of the currently open web page with reference file in MSWord format:
```javascript
function ComparePageToWordFile(refWordPath)
```
	Note: This function assumes that you have Microsoft Office installed on current machine.


## Example

```javascript
Navigator.Open('http://www.libraryinformationsystem.org/');

ComparePageToTextFile( "Library Information System.txt" );
ComparePageToWordFile( '%WORKDIR%/Library Information System.docx' );
```

## Usage

Copy contents of the [User.js](User.js) into your `User.js`, add relevant `.txt` or `.docx` file to your test and call the function.