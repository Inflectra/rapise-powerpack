
/**
 * Wait for given process to appear in the process list
 */
function WaitForProcess(/**string*/exeName, /**number*/timeout) {
	timeout = timeout||30000;
	var s = _SeSCurrMillis()
	do
	{
		var pid = _FindProcessByNameAndPartOfCmd(exeName, '');
		if(pid) return pid;
	} while(_SeSCurrMillis()-s < timeout);
	return false;
}

/**
 * Wait while given process is still running
 */
function WaitUntilProcessClosed(/**string*/exeName, /**number*/timeout) {
	timeout = timeout||30000;
	var s = _SeSCurrMillis()
	do
	{
		var pid = _FindProcessByNameAndPartOfCmd(exeName, '');
		if(!pid) return true;
	} while(_SeSCurrMillis()-s < timeout);
	return pid;
}


function _FindProcessByNameAndPartOfCmd(exeName, partOfCmd)
{
	var wbemFlagReturnImmediately = 0x10;
	var wbemFlagForwardOnly = 0x20;

	var objWMIService = GetObject("winmgmts://./root/CIMV2");
	if (!objWMIService)
	{	
		return false;
	}
	var colItems = objWMIService.ExecQuery("SELECT * FROM Win32_Process");

	if (!colItems)
	{
		return false;
	}
	
	var enumItems = new Enumerator(colItems);
	for (; !enumItems.atEnd(); enumItems.moveNext()) 
	{
		var objItem = enumItems.item();
		var name= objItem.Name;
		var cmd = objItem.CommandLine;
		if( name.toLowerCase()==exeName.toLowerCase() )
		{
			if(partOfCmd)
			{
				if(cmd.toLowerCase().indexOf(partOfCmd.toLowerCase())>=0)
				{
					return objItem.ProcessId;
				}
			} else {
				return objItem.ProcessId;
			}
		}
	}
	return false;
}