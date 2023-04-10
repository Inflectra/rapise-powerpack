
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
{
	var dms = g_util.ParseDate(dstr, fmt);
	var res = g_util.FormatDate(dms, newFmt);
	if(l2) Log2("ReFormatDateTime: "+dstr+" => "+res);
	return res;
}

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
{
	if(typeof(decPlaces)=='undefined') decPlaces = 2;
	decSep = decSep || '.';
	thouSep = thouSep || '';
	number = parseFloat(number);
	var sign = number < 0 ? "-" : "";
	var i = String(parseInt(number = Math.abs(Number(number) || 0).toFixed(decPlaces)));
	var j = (j = i.length) > 3 ? j % 3 : 0;
	
	return sign +
		(j ? i.substr(0, j) + thouSep : "") +
		i.substr(j).replace(/(\decSep{3})(?=\decSep)/g, "$1" + thouSep) +
		(decPlaces ? decSep + Math.abs(number - i).toFixed(decPlaces).slice(2) : "");
	
}
