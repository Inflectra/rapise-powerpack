# Import JUnit XML Files

This sample project contains a function:

```javascript
function ImportJUnitReport(/**string*/path, /**boolean*/includeProperties)
```


Where
* `path` - path to .xml file with report
* `includeProperties` - set to 'false' if you want to skip transfer of <properties> values into Rapise Report. Otherwise use `True`.

## How to Use

Copy contents of the `User.js` file into `User.js` of your test or your test framework.

## Example Usage

1. Launch external program that outputs results in JUnit format (I.e. JUnit, SOAP UI etc). You may use Global.DoLaunch or refer to this article https://www.inflectra.com/Support/KnowledgeBase/KB227.aspx to execute a batch file.
2. Call *ImportJUnitReport* to import the results.



