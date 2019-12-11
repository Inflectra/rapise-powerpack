/**
 * Checks process status. If pidOrName argument is not passed the function prints all running processes to the log file.
 & @param [pidOrName] Process ID or name.
 * @returns true if the process is running, false otherwise.
 */
function IsProcessRunning(/**string|number*/ pidOrName) /**boolean*/
{
	var strComputer = ".";
	var SWBemlocator = new ActiveXObject("WbemScripting.SWbemLocator");
	var objCtx = new ActiveXObject("WbemScripting.SWbemNamedValueSet")
	objCtx.Add("__ProviderArchitecture", 64);    
	var objWMIService = SWBemlocator.ConnectServer(strComputer, "/root/CIMV2", "", "", null, null, null, objCtx);
	
	var query = "Select * from Win32_Process";
	if(typeof(pidOrName) == "number")
	{
		query += " WHERE Handle=" + pidOrName;
	}
	else if (typeof(pidOrName) == "string")
	{
		query += " WHERE Name='" + pidOrName + "'";
	}
	var colItems = objWMIService.ExecQuery(query);
	
	var e = new Enumerator(colItems);
	for(; ! e.atEnd(); e.moveNext())
	{
		Log(e.item().Handle + ":" + e.item().Name);
		if (pidOrName) return true;
	}
	
	if (pidOrName) return false;
}

/**
 * Checks service state. If name is not specified the function prints state of all services to the log.
 * @param [name] Name of a service.
 * @returns true is service is running, false otherwise.
 */
function IsServiceRunning(/**string*/ name) /**boolean*/
{
	var strComputer = ".";
	var SWBemlocator = new ActiveXObject("WbemScripting.SWbemLocator");
	var objCtx = new ActiveXObject("WbemScripting.SWbemNamedValueSet")
	objCtx.Add("__ProviderArchitecture", 64);    
	var objWMIService = SWBemlocator.ConnectServer(strComputer, "/root/CIMV2", "", "", null, null, null, objCtx);
	
	var query = "Select * from Win32_Service";
	if(name)
	{
		query += " WHERE Name='" + name + "'";
	}
	var colItems = objWMIService.ExecQuery(query);
	
	var e = new Enumerator(colItems);
	for(; ! e.atEnd(); e.moveNext())
	{
		Log(e.item().Name + ":" + e.item().State);
		if (name) 
		{
			if (e.item().State.toLowerCase() == "running")
			{
				return true;			
			}
			else
			{
				return false;
			}
		}
	}
	
	if (name) return false;
}

