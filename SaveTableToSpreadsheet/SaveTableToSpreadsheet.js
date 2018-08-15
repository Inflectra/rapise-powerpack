/**
 * Puts data from a table into a spreadsheet with specified name.
 * @param objId Id of an object with Table/Grid flavor. It must have Cell, ColumnCount, RowCount and ColumnName propeties.
 * @param fileName Name of a spreadsheet file to save data.
 * @param [sheetName="Sheet1"] Name of a sheet to create in the spreadsheet.
 * @returns true if successfull, false otherwise.
 */
function SaveTableToSpreadsheet(/**objectId*/ objId, /**string*/ fileName, /**string*/ sheetName) /**boolean*/
{
	var table = SeS(objId);
	if (!table)
	{
		return false;
	}

	File.Delete(fileName);

	sheetName = sheetName || "Sheet1";
	var s = new SeSSpreadSheetObject();
	s.DoCreate(fileName, sheetName);
	s.DoRemoveColumn(0);
	
	var colCount = table.GetColumnCount();
	for(var i = 0; i < colCount; i++)
	{
		s.DoAddColumn(table.GetColumnName(i));
	}
	
	var rowCount = table.GetRowCount();
	for(var row = 0; row < rowCount; row++)
	{
		s.DoAddRow();
		for(var col = 0; col < colCount; col++)
		{
			var value = table.GetCell(row, col);
			s.SetCell(value, col, row + 1);
		}
	}

	return s.DoSave();
}