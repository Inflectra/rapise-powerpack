/**
 * Play all sheets in the given RVL script one-by-one. When called form one of RVL
 * sheets without parameters, it calls all other sheets in the given RVL script.
 * @param {optScriptName} .rvl.xlsx script path. If empty, currently executed RVL script is used.
 * @param {optExcludeSheet} optional name of the sheet to exclude. May be empty together with `optScriptName`
 * @param optScriptName Path to a folder.
 */
function PlayAllSheets( /**string*/ optScriptName, /**string*/optExcludeSheet) {
	optExcludeSheet = "";
	if (optScriptName) {
	} else if (RVL._current_rvl_execution_stack) {
		var s = RVL._current_rvl_execution_stack;
		if (s.CurrentItem && s.CurrentItem.HasCurrItem()) {
			var item = s.CurrentItem.CurrItem();
			optScriptName = item.Script.FileName;
			optExcludeSheet = item.Script.SheetName;
		}
	}
	
	if( !optScriptName || !File.Exists(optScriptName) ) {
		Tester.SoftAssert('PlayAllSheets: Unable to find script: '+optScriptName, false);
		return false;
	}
	
	var sw = new ActiveXObject("SeSWrappers.Utils.SpreadsheetWrapper");
	var res = sw.Open(optScriptName);
	var sheetNames = [];
	for(var i=0;i<sw.GetSheetCount();i++)
	{
		var n = sw.GetSheetName(i);
		if( n !=optExcludeSheet ) {
			sheetNames.push(n);
		}
	}
	sw.Close();

	Tester.BeginTest('PlayAllSheets: '+optScriptName);

	SeSEachKey(sheetNames, function(i, s) {
		RVL.DoPlayScript(optScriptName, s);
	});
	
	Tester.EndTest('PlayAllSheets: '+optScriptName);
}
