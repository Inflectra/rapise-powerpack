/**
 * Check speicified mailbox for a new mail message. We only check unread messages and
 * found messages are marked as read.
 * Please, note that for Gmail mailbox you need to set "Allow less secure apps: ON"
 */
function CheckForMail(
	/**string*/imapSvr, 
	/**string*/port, 
	/**string*/emailAddr, 
	/**string*/pwd,
	/**string*/folder,
	/**string*/subjectPattern,
	/**number*/timeout) {
	
	timeout=timeout||1000000;
	var start = new Date();
	
	var wsh = new ActiveXObject("WScript.Shell");
	
	imapSvr = imapSvr || "imap.gmail.com";
	port = port || 993;

	var cmd = 
	 '\"%WORKDIR%RapiseImapClient\\RapiseImapClient.exe\" '
	+'/imap:'+imapSvr+' '
	+'/port:'+port+' '
	+'/user:'+emailAddr+' '
	+'/password:'+pwd+' '
	+'/folder:'+folder+' '
	+'/command:list '
	+'/unread '
	+'/mark '
	+'/output:mailcheck.json '
	+'/days:1'
	
	var msElapsed = (new Date())-start;
	while(msElapsed<timeout)
	{
		Log("Checking mailbox: "+emailAddr);
		var errCode = wsh.Run(cmd, 10, true);
		if(errCode==0)
		{
			var mails = JSON.parse(File.Read('mailcheck.json'));
			for(var i=0;i<mails.items.length;i++)
			{
				var msg = mails.items[i];
				if( SeSCheckString(subjectPattern, msg.subject) )
				{
					Log('Found: '+msg.subject);
					return msg.body;
				}
			}
		}
		var msElapsed = (new Date())-start;
		Global.DoSleep(5000);
	} 
	
	Log('Nothing found in mailbox: '+emailAddr);
	
	return null;
}


/**
 * Check 'body' text and extract all links starting form http:// or https:// and return
 * the first one having 'linkText' as a substring. Return the whole link. Otherwise null is returned.
 *
 * Example Usage:
 *  var link = FindLinkHaving(emailBody, 'https://mysite.com/welcome/');
 *  
 */
function FindLinkHaving(/**string*/body, /**string*/linkText)
{
	var urlRegex = /(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+/g;
	var m = null;
	while(m = urlRegex.exec(body))
	{
		// Match found!
		var res = m[0]; // get first match
		if(res.indexOf(linkText)>=0)
		{
			Log('Found URL: '+res);
			return res;
		}
	}
	
	return null;
}
