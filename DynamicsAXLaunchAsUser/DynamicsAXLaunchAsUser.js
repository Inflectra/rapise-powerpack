/**
 * Launches Dynamics AX Desktop Client as User.
 * This function requires PsTools to be installed on the machine where you run tests:
 * https://www.inflectra.com/Support/KnowledgeBase/KB305.aspx
 * @param userName
 * @param password
 * @param [domain]
 */
function DynamicsAXLaunchAsUser(/**string*/ userName, /**string*/ password, /**string*/ domain)
{
	if (domain)
	{
		userName = domain + "\\" + userName;
	}
	var programPath = "C:\\Program Files (x86)\\Microsoft Dynamics AX\\60\\Client\\Bin\\Ax32.exe";
	var cmdLine = 'c:\\System\\PsTools\\psexec.exe -u "' + userName + '" -p "' + password + '" "' + programPath + '"';
	Tester.Message(cmdLine);
	Global.DoLaunch(cmdLine);
}
