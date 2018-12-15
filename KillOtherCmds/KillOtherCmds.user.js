//Put your custom functions and variables in this file


/**
 *	Kill process by its executable path or part of cmdLine.
 *  Uses partial, case insensitive comparison. I.e.
 * 		execPath "Cmd.exe" will match c:\Windows\System32\cmd.exe
 * 
 *	Specific feature of this implementation is that it checks if given process belongs to
 *	currently executing test. If so, it is ignored.
 *	So the purpose is to kill anything left after unsuccessfull execution of previous processes.
 */
function KillProcessByNameExcludingSelf(/**string*/execPath, /**string*/cmdLine)
{
	var wmi  = GetObject("winmgmts:{impersonationLevel=impersonate}!\\\\.\\root\\cimv2")
	   , col =null, prc=null;
	
	var pid = g_util.GetCurrentProcessId();
	var ppid = 0;
	var ownProcess = wmi.ExecQuery("SELECT * FROM Win32_Process WHERE ProcessId="+pid+"");
	var enumItems = new Enumerator(ownProcess);
	for (; !enumItems.atEnd(); enumItems.moveNext()) 
	{
		var objItem = enumItems.item();
		ppid = objItem.ParentProcessId;
	}
	
	col=wmi.ExecQuery("SELECT * From Win32_Process");
	
	var prl = new Enumerator(col);
	for (; !prl.atEnd(); prl.moveNext())
	{
		prc = prl.item();
		
		var e = true;
		var c = true;
		var self = false;
		
		
		
		if( execPath && (""+prc.ExecutablePath).toLowerCase().indexOf( execPath.toLowerCase() ) < 0 ) 
		{
			e = false;
		} else {
			Log("Found by execPath: " + prc.ParentProcessId + " PID: " + prc.ProcessId + " Name: " + prc.Name+" : " + prc.ExecutablePath + " => " + prc.CommandLine );
		}
		
		
		if( cmdLine && (""+prc.CommandLine).toLowerCase().indexOf( cmdLine.toLowerCase() ) < 0 )
		{
			c = false;
		} else {
			Log("Found by cmdLine: " + prc.ParentProcessId + " PID: " + prc.ProcessId + " Name: " + prc.Name+" : " + prc.ExecutablePath + " => " + prc.CommandLine );
		}
		
		if(prc.ProcessId == pid || prc.ProcessId == ppid )
		{
			if(l3) Log3("Self PPID: " + prc.ParentProcessId + " PID: " + prc.ProcessId + " Name: " + prc.Name+" : " + prc.ExecutablePath + " => " + prc.CommandLine );
			self = true;
		}
		if( e && c && !self )
		{
			if(l2) Log2("Killing PPID: " + prc.ParentProcessId + " PID: " + prc.ProcessId + " Name: " + prc.Name+" : " + prc.ExecutablePath + " => " + prc.CommandLine );
			prc.Terminate(0);
		}
		
	}
}