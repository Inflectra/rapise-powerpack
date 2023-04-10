![Download](https://github.githubassets.com/images/icons/emoji/unicode/23ec.png?v8) [Download Now](https://inflectra.github.io/DownGit/#/home?url=https://github.com/Inflectra/rapise-powerpack/tree/master/ReFormat)

# ReFormatDateTime, ReFormatNumber functions

```javascript
/**
 * Parse a date or time string using given format specifier and then format it using another format specifier
 * Formatting is described here: https://learn.microsoft.com/en-us/previous-versions/dotnet/netframework-3.0/8kb3ddd4(v=vs.85)
 * Example: ReFormatDateTime('2020-05-10 15:30', 'yyyy-MM-dd HH:mm', 'MM/dd/yyy'); // returns '05/10/2020'
 */
function ReFormatDateTime(
	/**string*/dstr, 
	/**string*/fmt, 
	/**string*/newFmt
)/**string*/


/**
 * Parse a date or time string using given format specifier and then format it using another format specifier
 * Formatting is described here: https://learn.microsoft.com/en-us/previous-versions/dotnet/netframework-3.0/8kb3ddd4(v=vs.85)
 * Example: ReFormatNumber('25', 2, '.'); // returns '05/10/2020'
 */
function ReFormatNumber(
	/**number|string*/number,
	/**number*/decPlaces, 
	/**string*/decSep, 
	/**string*/thouSep)/**string*/
```

# Example

Download and run this test to see the functions in action.

# Using

Copy functions from [User.js](User.js)
