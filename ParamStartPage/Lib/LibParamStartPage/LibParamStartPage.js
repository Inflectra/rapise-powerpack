// Put library code here
var g_startPageParamFileInfoPath = 'Lib/LibParamStartPage/ParamInfo.json';
var g_startPageUpdateFileInfoPath = 'Lib/LibParamStartPage/ParamUpdates.json';

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
		if(!rootTest) rootTest = test;
		
		var fromFolder = rootTest.GetWorkDirAbsolute();
		sstestPath = g_util.MakeRelativePath(fromFolder, sstestPath);
		res[sstestPath] = res[sstestPath] || {params:[]};
		var pinfObj = res[sstestPath];
		pinfObj.params=[];
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