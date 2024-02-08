/**
 * @PageObject TableHandler makes it easy to work with <table></table> based tables.
 */
SeSPageObject("TableHandler");

/*
 * Get number of <tr> rows in the table
 */
function TableHandler_GetRowCount()
{
	var xpath = '//table';
	var res = Navigator.DOMQueryValue(xpath, 'count(.//tr)');
	Log("TableHandler_GetRowCount: "+res);
	return res;
}

function _ColumnIndexByName(/**string*/name)
{
	var query = 'count(//table//tr[1]//th[normalize-space(.)='+JSON.stringify(name)+']/preceding-sibling::th)';
	var res = Navigator.DOMQueryValue(null, query);
	Log("_ColumnIndexByName: "+name+": "+res+" query: "+query);
	return res;
}

function _FindRowByText(/**string*/rowText)/**number*/
{
	var query = 'count(//tr[contains(normalize-space(.),'+JSON.stringify(rowText)+')]/preceding-sibling::tr)';
	var rowInd = Navigator.DOMQueryValue(null, query);
	Log("_FindRowByText: "+rowText+": "+rowInd+" query: "+query);
	return rowInd;
}

/** @paraminfo */
function TableHandler_DoClickCell(/**string*/rowText, /**string*/colId)
{
	rowText = rowText || 'Saturday';
	colId = colId || 'Edit';
	var rowInd = _FindRowByText(rowText);
	var colInd = _ColumnIndexByName(colId);
	if(rowInd>0 && colInd>0)
	{
		var cell = /**HTMLObject*/Navigator.DOMFindByXPath('//table//tr['+(rowInd+1)+']/td['+(colInd+1)+']');
		if(cell) {
			// If there is a link in this cell
			var found = cell.DoDOMQueryXPath('./a');
			if( found && found.length==1 )
			{
				// click on the link
				found[0].DoClick();
			} else {
				// otherwise click on the cell.
				cell.DoClick();
			}
			return true;
		} else {
			Tester.SoftAssert('TableHandler_DoClickCell: Cell not found: '+rowText+'/'+colId, false);
		}
	} else {
		Log("TableHandler_DoClickCell: "+rowText+"->"+rowInd+" : "+colId+"->"+colInd+" : Cell not found");
	}
	return false;
}

var _paramInfoTableHandler_DoClickCell = {
	_: "Find row containing given `rowText` and click the cell in column `colId`",
	rowText:
	{
		description: "Text to find"
	},
	colId:
	{
		description: "Column caption for a cell to click in"
	}
}

/**
 * Find a row containing `rowText` and check that it also has cell having `otherText`.
 */
function TableHandler_VerifyRow(/**string*/rowText, /**string*/otherText)
{
	rowText = rowText || 'Saturday';
	otherText = otherText || 'Contemporary Fiction';
	var rowInd = _FindRowByText(rowText);
	if( rowInd ) {
		var txt = Navigator.DOMQueryValue(null,'normalize-space(//table//tr['+(rowInd+1)+'])');
		var cell = Navigator.DOMFindByXPath('//table//tr['+(rowInd+1)+']/td[contains(normalize-space(.),'+JSON.stringify(otherText)+')]');
		if(cell) {
			Tester.SoftAssert('TableHandler.VerifyRow: Found: '+rowText+'/'+rowInd+' col: '+otherText, true, txt);
			return true;
		} else {
			Tester.SoftAssert('TableHandler_VerifyRow: Cell not found: '+rowText+'/'+rowInd+' col: '+otherText, false);
		}
	} else {
		Tester.SoftAssert('TableHandler_VerifyRow: Row not found: '+rowText+'/'+rowInd, false, 'Row Text: '+txt);
	}

}