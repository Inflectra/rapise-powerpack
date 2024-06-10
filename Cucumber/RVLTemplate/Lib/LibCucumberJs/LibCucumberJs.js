//Put your custom functions and variables in this file

if( typeof(require)!='undefined' )
{
	var Given = require('@cucumber/cucumber').Given;
	var When  = require('@cucumber/cucumber').When;
	var Then  = require('@cucumber/cucumber').Then;
	var Before = require('@cucumber/cucumber').Before;
	var After = require('@cucumber/cucumber').After;
	
	var BeforeStep = require('@cucumber/cucumber').BeforeStep;
	var AfterStep = require('@cucumber/cucumber').AfterStep;
	var BeforeAll = require('@cucumber/cucumber').BeforeAll;
	var AfterAll = require('@cucumber/cucumber').AfterAll;
}

function Cucumber_Run(/**string*/featurePath)
{
	featurePath=featurePath||'features/*.feature';
	if( !(featurePath instanceof Array) )
	{
		featurePath = [g_helper.ResolveEnvironmentVariables(featurePath)];
	}
	
	var done = false;
	
	async function runCucumberTests()
	{
		try
		{
			var Cli = require('@cucumber/cucumber').Cli;
			var runArgs = ['node', 'cucumber-js'].concat("--format", "./Lib/LibCucumberJs/CucTesterFormat.js", featurePath, "--format-options", '{"forceExit": false, "snippetInterface": "synchronous", "snippetSyntax": "./Lib/LibCucumberJs/RvlScriptSyntax.js", "colorsEnabled": false}');
			var cli = new Cli({argv: runArgs, cwd: process.cwd(), stdout: process.stdout});
			await cli.run();
		} finally {
			done = true;
		}
	}
	
	var deasync = require("deasync");
	runCucumberTests();
	while(!done)
	{
		deasync.runLoopOnce();
	}
	
	if(l2) Log2("Cucumber.Run done");
	CucumberDumpMissingImpl();

}

var _paramInfoCucumber_Run = {
    _description: "Run a Feature file(s) using CucumberJS",
    featurePath: {
        description: "Path to a .feature file.",
        type:"string", 
        binding: "path", 
        ext:"feature"
    }
};

function RVLPlaySection(rvlPath, rvlSheet, sectionName, namedArgs, world)
{
	if(world)
	{
		Log("World: "+world);
	}
	world = world || {};

	var ext = rvlPath.toLowerCase().substr(-3);
	if(rvlPath && rvlPath.length>3 && rvlPath.toLowerCase().substr(-3)==".js")
	{
		rvlPath = rvlPath.substr(0,rvlPath.length-3)+".rvl.xlsx";
	}
	
	rvlSheet = rvlSheet || "RVL";

	var sections = RVLGetSections(rvlPath, rvlSheet);
	if(sections && sections[sectionName])
	{
		var section = sections[sectionName];
		var lastParams = {};
		
		if(world && world.lastContext)
		{
			for(var p in world.lastContext) lastParams[p] = world.lastContext[p];
		}

		for(var p in namedArgs) lastParams[p] = namedArgs[p];
		
		
		lastParams.MustUse = lastParams;
		RVL.LastParams = lastParams;
		
		RVL.DoPlayScript(rvlPath, rvlSheet, section.startRow, section.endRow, sections.LastPreambleSheetRowIndex );
		
		world.lastContext = RVL._current_rvl_execution_stack.LocalContext.ContextVars;
		
	} else {
		Tester.Assert('Section: "'+sectionName+'" was not found in: '+rvlPath+':'+rvlSheet, false, [sectionName, rvlPath, rvlSheet]);
	}
}

function RVLGetSections(rvlPath, rvlSheet)
{
	var sections={};
	function __addSection(startRow, endRow, flow, name)
	{
		sections[name] = {startRow:startRow, endRow:endRow, flow:flow, name:name};
	}
	
	var resObj = RVL.DoParseScript(rvlPath, rvlSheet);
	if(resObj.result)
	{
		console.log("resObj", resObj);
		var s = resObj.ctx.script;
		sections.LastPreambleSheetRowIndex = s.LastPreambleSheetRowIndex;
		if(s && s.Rows && s.Rows.length>1 )
		{
			var sectionStart = -1;
			var sectionFlow, sectionType;
			
			for(var rowInd=1;rowInd<s.Rows.length;rowInd++)
			{
				var row = s.Rows[rowInd];
				var text = row.GetAllText();
				var rowFlow = (""+row.Flow).toLowerCase();
				var rowType = row.Type;
				
				if( rowFlow && (rowFlow=="#given" || rowFlow=="#when" || rowFlow=="#then" || rowFlow=="//given" || rowFlow=="//when" || rowFlow=="//then") )
				{
					if(sectionStart>0)
					{
						__addSection(sectionStart, rowInd-1, sectionFlow, sectionType);
					} else {
						sections.LastPreambleSheetRowIndex = Math.min(sections.LastPreambleSheetRowIndex, rowInd-1);
					}
					sectionStart = rowInd;
					sectionFlow = row.Flow;
					sectionType = row.Type;
				}
			}

			if(sectionStart>0)
			{
				__addSection(sectionStart, rowInd-1, sectionFlow, sectionType);
			}
		}

	}
	
	return sections;
}



var g_cucumberImpl = {};
function CucumberRegisterMissingImpl(id, opt, msg)
{
	g_cucumberImpl[id] = msg;
}

function CucumberDumpMissingImpl()
{
	if( g_cucumberImpl )
	{
		
		var res = "// ================================\n\n";
		for(var i in g_cucumberImpl)
		{
			res+=g_cucumberImpl[i]+"\n\n";
		}
		res+="// ================================\n\n";
		
		Log(res);
	}
}

if (typeof(SeSGlobalObject) != "undefined")
{
	SeSGlobalObject("Cucumber");
}
