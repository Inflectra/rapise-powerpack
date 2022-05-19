//Use 'Record/Learn' button to begin test recording

function Test(params)
{
	var query = "select * from tbl1;";
	var dbPath = Global.GetFullPath("%WORKDIR%\\mydb1");
	var queryResult = QuerySQLite(dbPath, query);
	Tester.Message("Query Returned: "+queryResult.length+" rows");
}

