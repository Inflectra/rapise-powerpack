
/**
 * QuerySQLite - query sqlite database and return result as object 
 * Pre-requisite: make sure that test contains `tools` subfolder with `tools\sqlite3.exe` and `tools\query.cmd` in it.
 *  dbPath - full path to a local db file
 *  query - sqlite query, i.e. select * from mytable;
 */
function QuerySQLite(dbPath, query)
{
	var outputPath = Global.GetFullPath("%WORKDIR%\\tools\\queryoutput.json");
	var cmdPath = Global.GetFullPath("%WORKDIR%\\tools\\query.cmd");
	File.Delete(outputPath);
	Global.DoCmd('"'+cmdPath+'" "'+dbPath+'" "'+query+'" "'+outputPath+'"', g_workDir, true, false);
	var resJsonStr = File.Read(outputPath);
	if(l2) Log2("Query result: "+resJsonStr);
	var res = JSON.parse(resJsonStr);
	return res;
}