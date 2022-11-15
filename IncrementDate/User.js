
/**
 * Parse date using given format specifier.
 * Formatting is described here: https://msdn.microsoft.com/en-us/library/az4se3k1(v=vs.85).aspx
 * Example: yyyy-MM-dd HH:mm
 * Add/Subtract specified number of years, months, days, hours, minutes
 * (May be negative or positive, i.e. months=2 adds 2 months, months=-3 goes 3 months back, months=0 leaves months intact)
 * Format it back and return.
 */
function IncrementDate(
	/**string*/dstr, 
	/**string*/fmt, 
	/**number*/years, 
	/**number*/months, 
	/**number*/days, 
	/**number*/hours, 
	/**number*/minutes)/**string*/
{
	var dms = g_util.ParseDate(dstr, 'yyyy-MM-dd HH:mm');
	var date = new Date(0 + dms);
	var y = date.getFullYear();
	var m = date.getMonth();
	var d = date.getDate();
	var H = date.getHours();
	var M = date.getMinutes();
	
	var d = new Date(
		y+(years||0),
		m+(months||0),
		d+(days||0),
		H+(hours||0),
		M+(minutes||0)
	);
	return g_util.FormatDate(d.valueOf(), fmt);
}