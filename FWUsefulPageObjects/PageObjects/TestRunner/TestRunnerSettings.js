const TestRunnerAutomatedTestRunType = 2
const TestRunnerManualTestRunType = 1;

const TestRunnerSettings = 
{
	TestRunTypeId: TestRunnerManualTestRunType,

	ConfigFileName: "TestRunnerConfig.json",
	ParamExcludeFromAnalysis: {},
	ParamMinNumberOfTestRuns: 10,
	ParamMaxNumberOfTestRuns: 100000,
	
	LoadParameters()
	{
		this.ParamMinNumberOfTestRuns = Global.GetProperty("MinNumberOfTestRuns", 10, this.ConfigFileName);
		this.ParamMaxNumberOfTestRuns = Global.GetProperty("MaxNumberOfTestRuns", 100000, this.ConfigFileName);
		
		this.ParamExcludeFromAnalysis = {};
		const excludeListCommaSeparated = Global.GetProperty("ExcludeFromAnalysis", "", this.ConfigFileName);
		
		if (excludeListCommaSeparated) 
		{
			excludeListCommaSeparated.split(',')
			.map(item => item.trim()) 
			.filter(item => item !== "")
			.forEach(item => {
				this.ParamExcludeFromAnalysis[item] = 1;
			});
		}
	},
	
	SetParameter(name, value)
	{
		if (typeof(value) == "string")
		{
			if (name == "MinNumberOfTestRuns" || name == "MaxNumberOfTestRuns")
			{
				value = parseInt(value);
			}
		}
		Global.SetProperty(name, value, this.ConfigFileName);
	},
	
	GetDataPath(fileName)
	{
		const basePath =  Global.GetProperty("DataFolder", "AiReports", this.ConfigFileName);
		if (!File.FolderExists(basePath))
		{
			File.CreateFolder(basePath);
		}
		return `${basePath}\\${fileName}`;
	},
}
