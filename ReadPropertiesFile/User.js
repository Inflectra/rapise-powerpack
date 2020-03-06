
function PropertiesToJSON(/**string*/propPath, /**string*/jsonPath)
{
	var str = File.Read(propPath);
	
	str = str.replace(/\\\n/, "");
	
	var parts = str.split("\n");
	var obj = {};
	
	for(var i=0;i<parts.length;i++)
	{
		var line = parts[i];
	
		if( /(\#|\!)/.test(line.replace(/\s/g, "").slice(0, 1)) )
		{
			// Comment
		} else {
			var colonifiedLine = line.replace(/(\=)/, ":")
			var key = colonifiedLine.substring(0, colonifiedLine.indexOf(":"));
			key = Global.DoTrim(key);
			var value = colonifiedLine.substring(colonifiedLine.indexOf(":") + 1);
			value = Global.DoTrim(value);
			if(key)
			{
				obj[key] = value
			}
		}
	}
	
	if( jsonPath )
	{
		File.Write(jsonPath, JSON.stringify(obj, null, '\t') );
	}
	return obj;
}