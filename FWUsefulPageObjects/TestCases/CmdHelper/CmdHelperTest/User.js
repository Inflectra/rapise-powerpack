//Put your custom functions and variables in this file

function CmdHelperJsTest()
{
	Tester.BeginTest('JS Version')
	// Run it as a whole
	CmdHelper.DoCmd('netstat -n | findstr TCP | find /c /v ""');
	CmdHelper.VerifySuccess();
	
	// Run it per OS
	CmdHelper.DoCmdWin('netstat -n | findstr TCP | find /c /v ""');
	CmdHelper.DoCmdLin('netstat -n | grep TCP | wc -l');
	CmdHelper.VerifySuccess();
	
	// Or access intermediate results:
	CmdHelper.Pipe('netstat -n');
	CmdHelper.Pipe('findstr TCP');
	CmdHelper.DoCmd('find /c /v ""');
	var netstatOutput = CmdHelper.GetStdOut(0);
	Tester.Message("netstat: "+netstatOutput);
	var findStrOutput = CmdHelper.GetStdOut(1);
	Tester.Message("findstr: "+findStrOutput);
	var finalOutput = CmdHelper.GetStdOut(); // The same as GetStdOut(2);
	
	var cnt = CmdHelper.GetLinesCount(findStrOutput);
	Tester.AssertEqual("Find returns line count", cnt, finalOutput-0);
	// Effectively mix linux and win commands for the test to work on each environment:
	CmdHelper.Pipe('netstat -n'); // will run on both
	CmdHelper.PipeLin('grep TCP');
	CmdHelper.PipeWin('findstr TCP');
	CmdHelper.PipeLin('wc -l');
	CmdHelper.PipeWin('find /c /v ""');
	CmdHelper.DoCmd();
	CmdHelper.VerifySuccess();
	Tester.EndTest('JS Version')
}