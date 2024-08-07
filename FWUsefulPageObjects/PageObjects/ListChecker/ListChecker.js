
/**
 * @PageObject ListChecker helps comparing multiline strings with lists and dropdowns.
 * Expected list may be an array or also a multiline list. It may come from application,
 * from variable or from Dropdowns.
 *
 * @Version 1.0.1
 */
SeSPageObject("ListChecker");

/**
 * Verify that `menuContents` has all lines/items from `expected` and nothing else.
 */
function ListChecker_VerifyMenu(/**string*/menuContents, /**string||string[]*/expected)
{
	return _CompareMenuImpl(/**string*/menuContents, /**string||string[]*/expected, true);
}

/**
 * Verify that `menuContents` has all lines/items from `expected` and maybe something else.
 */
function ListChecker_VerifyMenuContains(/**string*/menuContents, /**string||string[]*/expected)
{
	return _CompareMenuImpl(/**string*/menuContents, /**string||string[]*/expected, false);
}

function _CompareMenuImpl(/**string*/menuContents, /**string||string[]*/expected, /**bool*/checkUnexpected, /**string*/optListId)
{
	var obj = {};
	var items = menuContents.split('\n');
	var missingCnt = 0;
	var unexpectedCnt = 0;
	
	if( expected instanceof Array ) {
	} else if( typeof expected == 'string' ) {
		expected = expected.split('\n');
	}
	
	SeSEachKey(expected, function(i,v){
		v = Text.Trim(v);
		if(v) {
			obj[v] = 'missing';
			missingCnt++;
		}
	});
	
	var missingItems = [];
	SeSEachKey(items, function(i,v){
		v = Text.Trim(v);
		if(!v) return;
		if(v in obj) {
			obj[v] = 'ok';
			missingCnt--;
		} else {
			obj[v] = 'unexpected';
			unexpectedCnt++;
		}
	});
	
	if(!checkUnexpected) {
		unexpectedCnt = 0;
	}
	
	var details = [];
	var detailsStr = JSON.stringify(obj, null, '\t');
	detailsStr = detailsStr.replace(/[\{\,\}\t]/ig,'');
	detailsStr = Text.Trim(detailsStr);
	details = detailsStr.split('\n');
	
	var success = missingCnt==0&&unexpectedCnt==0;

	details.unshift('Missing: '+missingCnt+' Unexpected: '+unexpectedCnt);
	if(optListId) {
		details.push('List ID: ' + optListId);
	}

	Tester.SoftAssert('CompareMenu '+Text.Limit(expected, 25), 
		missingCnt==0&&unexpectedCnt==0, 
		details, 
		{comment:Text.Limit(menuContents, 25)} );
	
}

/**
 * Check that dropdown with `idList` defined in Dropdowns.xlsx has equals `menuContents` (has all same items, maybe in different order).
 */
function ListChecker_CompareToDropdown(/**string*/idList, /**string*/menuContents) {
	var list = ListChecker_GetDropdownList(idList);
	_CompareMenuImpl(/**string*/menuContents, /**string||string[]*/list, true, idList);
}

/**
 * Return values of dropdown with id `idList` as array of strings. The list is taken
 * from %WORKDIR%\Dropdowns.xlsx unless optional `xlsPath` is specified.
 */
function ListChecker_GetDropdownList(/**string*/idList, /**string*/xlsPath)
{
	xlsPath = xlsPath||"Dropdowns.xlsx";
	var inputPath = xlsPath;
	xlsPath = File.ResolvePath(xlsPath);
	if( xlsPath && File.Exists(xlsPath) )
	{
		var sw = new ActiveXObject("SeSWrappers.Utils.SpreadsheetWrapper");
		
		sw.Open(xlsPath);
		var jsColsStr = sw.GetDataColumnsJSONString();
		var jsCols = JSON.parse(jsColsStr);
		
		var l1 = jsCols[idList];
		if( l1 && l1.length>0) {
			// Remove column header
			l1.shift();
			return l1;
		} else {
			Tester.SoftAssert('Dropdown list: '+idList+' not found in '+xlsPath, false);
		}
	}
	return null;
}

