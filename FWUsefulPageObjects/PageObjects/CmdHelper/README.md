
Examples:

```javascript

So we want we may run such case as follows:

// Write stderro and stdout to files, return exit code
var exitCode = CmdHelper.DoCmd("netstat -n | FINDSTR TCP | find /c /v \"\"", "stdout.txt", "stderr.txt");

var stdOut = File.Read('stdout.txt');
var stdErr = File.Read('stderr.txt');


// Return exit code
var exitCode = CmdHelper.DoCmd("netstat -n | FINDSTR TCP | find /c /v \"\"");
// stdOut/stdErr/combo are collected from find, others are not collected
var outText = CmdHelper.GetStdOut();
var errText = CmdHelper.GetStdErr();
var outputWithErrorsText = CmdHelper.GetStdOutAndErr();
Tester.AssertNotEqual('Non zero exit code', exitCode, 0)


// Skip stderr, stdout, return exit code
var exitCode = CmdHelper.DoCmd("netstat -n | FINDSTR TCP | find /c /v \"\"", false);
// false means don't collect out/err anything
Tester.AssertNotEqual('Non zero exit code', exitCode, 0)


// Get output/error from last cmd
var outText = CmdHelper.GetStdOut();
var errText = CmdHelper.GetStdErr();


CmdHelper.Pipe("nestat -n")
CmdHelper.Pipe("FINDSTR TCP", false); // don't collect out/log for it - maybe it is long something
var exitCode = CmdHelper.DoCmd("find /c /v"); // DoCmd resets the stack of pipe's when executing them.
// This returns StdOut/StdErr from "find". 
var outText = CmdHelper.GetStdOut();
var errText = CmdHelper.GetStdErr();
var outputWithErrorsText = CmdHelper.GetStdOutAndErr();

We may also assign a sitream identifier to the stdout, i.e.:

CmdHelper.Pipe("nestat -n")
CmdHelper.Pipe("FINDSTR TCP");
var exitCode = CmdHelper.DoCmd();
var netstatOut = CmdHelper.GetStdOut(0);
var netstatErr = CmdHelper.GetStdErr(0);
var netstatOutAndErr = CmdHelper.GetStdOutAndErr(0);
var findstrOut = CmdHelper.GetStdOut(1);
var findstrErr = CmdHelper.GetStdErr(1);
var findstrOutAndErr = CmdHelper.GetStdOutAndErr(1);

CmdHelper.Pipe("nestat -n","netout.txt", "neterr.txt")
CmdHelper.Pipe("FINDSTR TCP","findoutanderr.txt"); // this means both out and err go to the same file.
var exitCode = CmdHelper.DoCmd();

// var netstatOut = CmdHelper.GetStdOut(0); - we should use 'netout.txt'
var netstatOut = File.Read("netout.txt");
var netstatErr = File.Read("neterr.txt");
var findstrOutAndErr = File.Read('findoutanderr.txt');


var LastResult = File.Read('neterr.txt')
Tester.VerifyContains("No exceptions in the output", LastResult, "exception");
var cnt = CmdHelper.GetLinesCount(LastResult);
Tester.AssertEqual("3 entries found", 3, cnt)
Tester.AssertGreater("more than 3 entries found", LastResult, 3);
```