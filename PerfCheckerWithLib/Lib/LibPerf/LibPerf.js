//Put your custom functions and variables in this file

var g_perfSection = {};
var g_perfHistory = {};
var g_perfColumn = "";

function Perf_SetRvlColumn(/**string*/colId)
{
	Log("Setting perf column: "+colId);
	g_perfColumn = colId;
	if(colId)
	{
		OnRVLScriptStep=function(item, place, status, ctx, stackItem)
		{
			if(place == "before")
			{
				var row = item.Startrow;
				
				// If 'H' has value, assign an attribute, otherwise clear it.
				if(row.Ext&&row.Ext[colId])
				{
					if(g_perfSection.id!=row.Ext[colId])
					{
						Perf_BeginSection(row.Ext[colId]);
					}
				} else {
					Perf_EndSection();
				}
			}
		}
	}
}

_paramInfoPerf_SetRvlColumn = {
    _description: "Contents of the specified RVL column are treated as section name. Each ti",
    _type: "number",
    _returns: "number of section occurencies",
    colId:
    {
        type: "string",
        description: "Extra Column ID",
        binding: "enum",
		enumName: "ExtraColumn",
		defaultValue: "H",
		enumOpts: [
			["H"],
			["I"],
			["J"]
		]
    }
}


function Perf_BeginSection(/**string*/sectionId)
{
	Perf_EndSection();
	g_perfSection = {
		id:sectionId,
		start: _SeSCurrMillis()
	};
}
_paramInfoPerf_BeginSection = {
    _description: "Mark new occurence of the section. The time of everything executed before Perf.EndSection or another Perf.BeginSection is added to this section.",
    _type: "number",
    _returns: "number of section occurencies",
    sectionId:
    {
        description: "Perfomance section ID"
    }
}

function Perf_EndSection()
{
	if(g_perfSection.id)
	{
		var sectionTime = _SeSCurrMillis() - g_perfSection.start;
		
		if(!g_perfHistory[g_perfSection.id]) {
			var sec = g_perfSection;
			sec.totalTime = 0;
			sec.occurs = 0;
			sec.lastTime = NaN;
			sec.minTime = NaN;
			sec.maxTime = NaN;
			g_perfHistory[g_perfSection.id] = sec;
		}
		
		var sec = g_perfHistory[g_perfSection.id];
		sec.totalTime+=sectionTime;
		sec.occurs++;
		sec.lastTime = sectionTime;
		
		if( isNaN(sec.minTime) || sec.minTime>sectionTime ) sec.minTime = sectionTime;
		if( isNaN(sec.maxTime) || sec.maxTime<sectionTime ) sec.maxTime = sectionTime;
		
		Tester.Message(sec.id+": "+sec.lastTime+"ms", [
			new SeSReportText("#Occurencies: "+sec.occurs),
			new SeSReportText("Total Time: "+sec.totalTime),
			new SeSReportText("MinTime: "+sec.minTime),
			new SeSReportText("MaxTime: "+sec.maxTime),
			new SeSReportText("AvgTime: "+Math.round(sec.totalTime/sec.occurs))
			]);
	}
	g_perfSection={};
}

_paramInfoPerf_EndSection = {
    _description: "Mark that given occurence of the section started with Perf.BeginSection is done",
    _type: "number",
    _returns: "number of section occurencies"
}

function Perf_GetLast(/**string*/sectionId)
{
	if(g_perfHistory[sectionId])
	{
		return g_perfHistory[sectionId].lastTime;
	}
	return NaN;
}

_paramInfoPerf_GetMin = {
    _description: "Get last execution time for a section",
    _type: "number",
    _returns: "number of section occurencies",
    sectionId:
    {
        description: "Perfomance section ID"
    }
}

function Perf_GetMin(/**string*/sectionId)
{
	if(g_perfHistory[sectionId])
	{
		return g_perfHistory[sectionId].minTime;
	}
	return NaN;
}

_paramInfoPerf_GetMin = {
    _description: "Get minimal execution time for a section",
    _type: "number",
    _returns: "number of section occurencies",
    sectionId:
    {
        description: "Perfomance section ID"
    }
}


function Perf_GetMax(/**string*/sectionId)
{
	if(g_perfHistory[sectionId])
	{
		return g_perfHistory[sectionId].maxTime;
	}
	return NaN;
}

_paramInfoPerf_GetMax = {
    _description: "Get max execution time for a section",
    _type: "number",
    _returns: "number of section occurencies",
    sectionId:
    {
        description: "Perfomance section ID"
    }
}

function Perf_GetAvg(/**string*/sectionId)
{
	if(g_perfHistory[sectionId])
	{
		return Math.round(g_perfHistory[sectionId].totalTime/g_perfHistory[sectionId].occurs);
	}
	return NaN;
}

_paramInfoPerf_GetAvg = {
    _description: "Get average execution time for a section",
    _type: "number",
    _returns: "number of section occurencies",
    sectionId:
    {
        description: "Perfomance section ID"
    }
}

function Perf_GetTotal(/**string*/sectionId)
{
	if(g_perfHistory[sectionId])
	{
		return g_perfHistory[sectionId].totalTime;
	}
	return NaN;
}

_paramInfoPerf_GetTotal = {
    _description: "Get total execution time for a section",
    _type: "number",
    _returns: "number of section occurencies",
    sectionId:
    {
        description: "Perfomance section ID"
    }
}

function Perf_GetOccurencies(/**string*/sectionId)
{
	if(g_perfHistory[sectionId])
	{
		return g_perfHistory[sectionId].totalTime;
	}
	return NaN;
}

_paramInfoPerf_GetOccurencies = {
    _description: "Get number of times specified section has been executed",
    _type: "number",
    _returns: "number of section occurencies",
    sectionId:
    {
        description: "Perfomance section ID"
    }
}


function Perf_AssertLast(/**string*/sectionId, /**number*/millis, /**string*/optMessage)
{
	optMessage = optMessage||"Checking that last '"+sectionId+"'<"+millis+"ms";
	var val = Perf_GetLast(sectionId);
	return Tester.Assert(optMessage, val<=millis, [val, ""+millis]);
}

_paramInfoPerf_AssertLast = {
    _description: "Assert that section last execution time is less than specified number of millis",
    _type: "boolean",
    _returns: "`true` if login is ok",
    sectionId:
    {
        description: "Perfomance section ID"
    },
    millis:
    {
        type: "number",
        defaultValue: 1000,
        description: "Max allowed number of milliseconds"
    },
    optMessage:
    {
        type: "string",
        optional: true,
        description: "Assertion message"
    }
}


function Perf_AssertAvg(/**string*/sectionId, /**number*/millis, /**string*/optMessage)
{
	optMessage = optMessage||"Checking that average '"+sectionId+"'<"+millis+"ms";
	var val = Perf_GetAvg(sectionId);
	return Tester.Assert(optMessage, val<=millis, [val, ""+millis]);
}

_paramInfoPerf_AssertAvg = {
    _description: "Assert that section average execution time is less than specified number of millis",
    _type: "boolean",
    _returns: "`true` if login is ok",
    sectionId:
    {
        description: "Perfomance section ID"
    },
    millis:
    {
        type: "number",
        defaultValue: 1000,
        description: "Max allowed number of milliseconds"
    },
    optMessage:
    {
        type: "string",
        optional: true,
        description: "Assertion message"
    }
}


function Perf_AssertTotal(/**string*/sectionId, /**number*/millis, /**string*/optMessage)
{
	optMessage = optMessage||"Checking that total '"+sectionId+"'<"+millis+"ms";
	var val = Perf_GetTotal(sectionId);
	return Tester.Assert(optMessage, val<=millis, [val, ""+millis]);
}

_paramInfoPerf_AssertTotal = {
    _description: "Assert that section total execution time is less than specified number of millis",
    _type: "boolean",
    _returns: "`true` if login is ok",
    sectionId:
    {
        description: "Perfomance section ID"
    },
    millis:
    {
        type: "number",
        defaultValue: 1000,
        description: "Max allowed number of milliseconds"
    },
    optMessage:
    {
        type: "string",
        optional: true,
        description: "Assertion message"
    }
}


function Perf_AssertMax(/**string*/sectionId, /**number*/millis, /**string*/optMessage)
{
	optMessage = optMessage||"Checking that max '"+sectionId+"'<"+millis+"ms";
	var val = Perf_GetMax(sectionId);
	return Tester.Assert(optMessage, val<=millis, [val, ""+millis]);
}

_paramInfoPerf_AssertMax = {
    _description: "Assert that section Max execution time is less than specified number of millis",
    _type: "boolean",
    _returns: "`true` if login is ok",
    sectionId:
    {
        description: "Perfomance section ID"
    },
    millis:
    {
        type: "number",
        defaultValue: 1000,
        description: "Max allowed number of milliseconds"
    },
    optMessage:
    {
        type: "string",
        optional: true,
        description: "Assertion message"
    }
}

SeSGlobalObject("Perf");