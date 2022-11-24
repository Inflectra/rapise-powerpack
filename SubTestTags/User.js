/**
 * Find sub-tests have one or more tags and return as newline-separated string.
 * @param tags - string with expected tags, comma (,) separated, no spaces, case sensitive
 * @param rootSstest - optional path to root test file. 
 *        When not specified, current rootmost test is used.
 * @example
 * FindAllSubTestsByTag('group1') - find all sub-tests having 'group1' tag starting from root.
 * FindAllSubTestsByTag('group1', '%WORKDIR%SubTestGroupMix\\SubTestGroupMix.sstest') - find all sub-tests having 'group1' tag starting from `SubTestGroup1`.
 * FindAllSubTestsByTag('group1,group2') - find all sub-tests having both 'group1' and `group2` tags.
 */
function FindAllSubTestsByTag( /**string*/ tags, /**string*/ rootSstest)
{
	var loadRoot = false;
	if (!rootSstest)
	{
		/*global g_sstestPath */
		rootSstest = g_sstestPath;
		loadRoot = true;
	}
	rootSstest = rootSstest || g_sstestPath;
	var factory = new ActiveXObject("SmarteStudio.Test.Test");
	var test = factory.LoadFromFile(g_helper.ResolveEnvironmentVariables(rootSstest));
	if (loadRoot)
	{
		test = test.GetFrameworkRoot();
	}
	tags = ("" + tags).replace(/;/g, ',');
	var tagsArr = tags.split(',');
	var tag0 = Global.DoTrim(tagsArr[0]);
	// FindAllSubTestsByTag returns multiline string - one path per line
	var foundTestCasesStr = test.TestFiles.FindAllSubTestsByTag(tag0, true);
	var resStr = "";
	if (tagsArr.length > 1)
	{
		var sep = "";
		// Check all other tags 
		var foundTestCases = foundTestCasesStr.split('\n');
		for (var t = 0; t < foundTestCases.length; t++)
		{
			var ttest = factory.LoadFromFile(g_helper.ResolveEnvironmentVariables(foundTestCases[t]));
			var allTagsPresent = true;
			for (var ti = 1; ti < tagsArr.length; ti++)
			{
				var subTag = Global.DoTrim(tagsArr[ti]);
				if (!ttest.HasTag(subTag))
				{
					allTagsPresent = false;
					break;
				}
			}
			if (allTagsPresent)
			{
				resStr += sep + foundTestCases[t];
				sep = '\n';
			}
		}
	}
	else
	{
		resStr = foundTestCasesStr;
	}
	return resStr;
}
/**
 * Dump all sub-tests and their tags to the report.
 */
function DumpAllSubTestTags( /**string*/ rootSstest)
{
	var loadRoot = false;
	if (!rootSstest)
	{
		rootSstest = g_sstestPath;
		loadRoot = true;
	}
	rootSstest = rootSstest || g_sstestPath;
	var factory = new ActiveXObject("SmarteStudio.Test.Test");
	var test = factory.LoadFromFile(g_helper.ResolveEnvironmentVariables(rootSstest));
	if (loadRoot)
	{
		test = test.GetFrameworkRoot();
	}
	// FindAllSubTestsByTag returns multiline string - one path per line
	var foundTestCasesStr = test.TestFiles.FindAllSubTestsByTag("", true);
	var resData = [];
	var resObj = {};
	var sep = "";
	// Check all other tags
	var foundTestCases = foundTestCasesStr.split('\n');
	for (var t = 0; t < foundTestCases.length; t++)
	{
		var ttest = factory.LoadFromFile(g_helper.ResolveEnvironmentVariables(foundTestCases[t]));
		var tags = ttest.Tags;
		resData.push(foundTestCases[t]);
		resData.push(tags);
		resObj[foundTestCases[t]] = tags;
	}
	Tester.Message(foundTestCases.length + " subtests in " + test.TestPath, resData);
	return resObj;
}
/**
 * Launch all sub-tests having specific tags using Global.DoInvokeTest. 
 * Passing `optionalParams` to each of them (see Global.DoInvoke test for more info).
 * @param tags - string with expected tags, comma (,) separated, no spaces, case sensitive
 * @param rootSstest - optional path to root test file. 
 *        When not specified, current rootmost test is used.
 * @param optionalParams - 
 */
function RunAllSubTestsByTag( /**string*/ tags, /**string*/ rootSstest, /**object*/ optionalParams)
{
	var found = FindAllSubTestsByTag(tags, rootSstest);
	var paths = found.split('\n');
	Tester.Message('RunAllSubTestsByTag: running ' + paths.length + ' for tag: ' + tags, true, found);
	for (var i = 0; i < paths.length; i++)
	{
		Global.DoInvokeTest(paths[i], optionalParams);
	}
}
/**
 * Launch all sub-tests having specific tags using RVL.DoPlayTest.
 * Optional parameters may be passed same way as described for RVL.DoPlayTest.
 */
function RunAllSubTestsByTagRvl( /**string*/ tags, /**string*/ rootSstest)
{
	var lp = RVL.LastParams;
	RunAllSubTestsByTag(tags, rootSstest, lp);
}