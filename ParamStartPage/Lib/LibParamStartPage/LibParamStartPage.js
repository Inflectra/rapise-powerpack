// Put library code here
var g_startPageParamFileInfoPath = 'Lib/LibParamStartPage/ParamInfo.json';
var g_startPageUpdateFileInfoPath = 'Lib/LibParamStartPage/ParamUpdates.json';
var g_startPageTestRunStatus = 'Lib/LibParamStartPage/LastRunStatus.json';

function PSP_ReadParamInfo()
{
	if( File.Exists(g_startPageParamFileInfoPath) ) {
		return JSON.parse(File.Read(g_startPageParamFileInfoPath));
	}
	return {};
}

function PSP_WriteParamInfo(paramInfo)
{
	File.Write(g_startPageParamFileInfoPath, JSON.stringify(paramInfo, null , '\t'));
}

function PSP_Build()
{
	var fso = new ActiveXObject("Scripting.FileSystemObject");
	var found = File.Find('', "*.sstest", true, false, true, false);
	var files = found.split('\n');
	var factory = new ActiveXObject("SmarteStudio.Test.Test");
	var rootTest = null;
	var res = PSP_ReadParamInfo();
	SeSEachKey(files, function(k,sstestPath) {
		Tester.Message(sstestPath);
		var test = factory.LoadFromFile(sstestPath);
		if(!rootTest) 
		{
			rootTest = test;
		}
		var groupPath = "";
		var tf = rootTest.TestFiles.FindFile(sstestPath, true);
		if(tf!=null) {
			var group = tf.parent;
			groupPath = group.GetGroupTreePath();
			if( groupPath.indexOf( '.sstest.Test' ) > 0 ) {
				groupPath = groupPath.split('.sstest.Test')[1];
				groupPath = Text.TrimStart(groupPath, '.');
				groupPath = groupPath.replace(/\./ig,'\\');
			}
		}
		var fromFolder = rootTest.GetWorkDirAbsolute();
		sstestPath = g_util.MakeRelativePath(fromFolder, sstestPath);
		res[sstestPath] = res[sstestPath] || {params:[]};
		var pinfObj = res[sstestPath];
		pinfObj.params=[];
		pinfObj.groupPath = groupPath;
		var cnt = test.GetTestParamsCount();
		for(var i=0;i<cnt; i++) {
			var pinf = test.GetTestParamInfoAt(i);
			if(pinf) {
				pinf = JSON.parse(pinf);
				pinfObj.params.push(pinf);
				pinfObj.tags = ""+test.Tags;
				
			}
		}
	});
	
	PSP_WriteParamInfo(res);
}

function PSP_ApplyChanges() {
	if( File.Exists(g_startPageUpdateFileInfoPath) ) {
		var updates = JSON.parse(File.Read(g_startPageUpdateFileInfoPath));
		var fso = new ActiveXObject("Scripting.FileSystemObject");
		var factory = new ActiveXObject("SmarteStudio.Test.Test");

		SeSEachKey(updates, function(k,v) {
			var test = factory.LoadFromFile(v.testpath);
			if( v.valueType=="param" ) {
				if( !test.SetTestParamDefaultValue(v.name, v.nvalue) ) {
					// Param not found - need to create its definition - in such cases we should
					// get more information from ParamUpdates.json or re-use parameter definition
					// from some other test captured via test.GetTestParamInfoAt(i);
					// test.CreateTestParameter(string name, string description, string variable, string defaultValue, string options, bool output, bool ask)
				}
			} else {
				test.Tags = v.nvalue;
			}
			test.Save("");
			Tester.Message("Updated: "+v.testpath+" "+v.name, v.nvalue);
		})
		File.Delete(g_startPageUpdateFileInfoPath);
	}
	PSP_Build();
}

function PSP_RunSubtest() {
	if(global.g_runSubtestPath) {
		Global.DoInvokeTest(global.g_runSubtestPath);
	} else {
		Tester.Assert('PSP_RunSubtest: no g_runSubtestPath specified', false);
	}
}

SeSOnTestReportReady(function()
{
	if( global.g_entryPointName == 'PSP_ApplyChanges' ) return;
	if( global.g_entryPointName == 'PSP_Build') return;

	// Write execution results into Lib/LibParamStartPage/LastRunStatus.json
	// Start page may read it and use to color the tests
	var status = {"TestPassed":false}
	// All done, don't try to do Tester.Message/Tester.Assert here - report is already closed
	if(g_testPassed==Tester.Pass)
	{
		status = {"TestPassed":true};
	}
	
	var sstestPath = 'undef:'+g_scriptFileName;
	if(global.g_runSubtestPath){
		// executed via PSP_RunSubtest
		sstestPath = global.g_runSubtestPath;
	} else {
		var fso = new ActiveXObject("Scripting.FileSystemObject");
		var found = File.Find(fso.GetParentFolderName(g_scriptFileName), "*.sstest", false, false, true, false);
		if(File.Exists(found)) {
			sstestPath = found;
		}
	}
	
	if( File.Exists( sstestPath ) ) {
		sstestPath = g_util.MakeRelativePath(g_workDir, sstestPath);
	}
	
	// Parse report and extract summary information (status, last failure, etc)
	var ldr = new ActiveXObject("Rapise.LogLoader");
	ldr.LoadTrp(g_reportFileName);
	var summaryPath = g_helper.ResolveEnvironmentVariables('%WORKDIR%Lib/LibParamStartPage/lastreport.json');
	var templatePath = File.ResolvePath('Lib/LibParamStartPage/ActionSummaryReport.tt');
	ldr.ExportAsHtml(templatePath, summaryPath);
	if( File.Exists(summaryPath) ) {
		var summary = File.Read(summaryPath);
		var summaryJs = JSON.parse(summary);
		if( summaryJs && summaryJs.length ) {
			status = summaryJs[0];
			if( global.g_runSubtestPath && summaryJs>1 ) {
				// When running with PSP_RunSubtest, the entry point is a framework root
				// So use 2nd status instead.
				status = summaryJs[1];
			}
		}
		File.Delete(summaryPath);
	}
	
	// Write the status back.
	var lastRunStatus = {};
	if( File.Exists(g_startPageTestRunStatus) ) {
		lastRunStatus = JSON.parse(File.Read(g_startPageTestRunStatus));
	}
	lastRunStatus[sstestPath] = status;
	File.Write(g_startPageTestRunStatus, JSON.stringify(lastRunStatus, null, '\t'));
})