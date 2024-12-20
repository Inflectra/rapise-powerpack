
/**
 * @PageObject Term description
 * @Version 0.0.2
 */
SeSPageObject("Term");


var g_termHwnd = null;
var g_termPort = 13270;

function Term_FindProcessByNameAndPartOfCmd(exeName, partOfCmd)
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
		if(l2) Log2("Name: "+name+" cmd: "+cmd);
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


function Term_FindOrAttach(url, bAttach)
{
	var cmdLine = "-httpd :"+g_termPort;

	var pid = g_helper.FindProcess("", "wc3270.exe");
	
	//pid = Term_FindProcessByNameAndPartOfCmd("%WORKDIR%x3270\\wc3270.exe", null);
	
	if( pid )
	{
	} else if(bAttach) {
		Tester.Assert('Terminal process is not started.', false);		
	} else if(url) {
		var wsh = new ActiveXObject('WScript.Shell');
	
		wsh.Run('"%WORKDIR%\\PageObjects\\Term\\x3270\\wc3270.exe" '+cmdLine+' '+url, 3, false);
		Global.DoSleep(1500);
		
		return Term_FindOrAttach(url, bAttach);
	}
	
	if(pid)
	{
		Log("Got terminal process ID: "+pid);
		for(var i=0;i<100;i++)
		{
			g_termHwnd = g_util.GetProcessMainWindow(pid);
			Log("Terminal HWND: "+g_termHwnd);
			
			if(g_termHwnd) break;
			
			Global.DoSleep(1000);
		}
		
		if(g_termHwnd)
		{
			Log("Restoring: "+g_termHwnd);
			g_termHwnd.Restore();
		}
	}
	
	if(!g_termHwnd)
	{
		Tester.Assert('Unable to attach to terminal window.', false, "PID: "+pid);
	}
}

function Term_Screenshot(comment)
{
	g_termHwnd.Restore();
	var img = SeSCaptureImageDefaultImpl(g_termHwnd.PosX, g_termHwnd.PosY, g_termHwnd.PosWidth, g_termHwnd.PosHeight, false)

	Tester.Message(comment, new SeSReportImage(img, "Screen"));
}

function _Term()
{
	if(!global.g_terminalWs)
	{
		global.g_terminalWs = new ActiveXObject('Rapise.WebServiceClient');
	}
	return global.g_terminalWs;
}


function _TermSendCommand(/**string*/qry)
{
	var request = {
		Name: "xl3270",
		Url: "http://localhost:"+g_termPort+"/3270/rest/stext/"+qry,
		Method: "GET"
	};


	var requestJson = JSON.stringify(request);
	var responseJson = _Term().ExecuteRESTRequest(requestJson);
	var resp = JSON.parse(responseJson);
	if(l2) Log2(qry+" => "+resp.Body);
	return resp.Body;
}

function Term_SendString(/**string*/str)
{
	_TermSendCommand("String("+str+")");
	Global.DoSleep(1000);
}

function Term_SendInput(/**string*/str)
{
	if(l2) Log2(" SendInput: "+str);
	for(var i=0;i<str.length;i++)
	{
		var keyCode = "0x"+str.charCodeAt(i).toString(16);
		_TermSendCommand("Key("+keyCode+")");
	}
	Global.DoSleep(1000);
}

function Term_EnsureText(/**string*/text, /**number*/timeout, /**boolean*/failIfNotFound)
{
	timeout = timeout || 1000;
	var start = new Date();
	
	var cmd = "PrintText(string)";
	
	var screenText = _TermSendCommand(cmd);

	while( (""+screenText).indexOf(text) < 0 )
	{
		if( (new Date() - start) > timeout )
		{
			if( failIfNotFound ) 
			{
				Tester.Assert('Failed to find text: '+text, false, new SeSReportText(screenText.replace(/\r/g, "<br/>"), "Screen text"));
			}
		
			return null;
		}
		
		
		Global.DoSleep(100);
	}
	Tester.Assert('Found text: '+text, true, new SeSReportText(screenText, "Screen text"));
	return true;
	
}

function Term_SendCommand(/**string*/cmd)
{
	var res = _TermSendCommand(cmd);
	Global.DoSleep(150);
	return res;
}

