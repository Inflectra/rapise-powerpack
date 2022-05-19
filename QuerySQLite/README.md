![Download](https://github.githubassets.com/images/icons/emoji/unicode/23ec.png?v8) [Download Now](https://inflectra.github.io/DownGit/#/home?url=https://github.com/Inflectra/rapise-powerpack/tree/master/QuerySQLite)

# QuerySQLite
This sample contains a function `QuerySQLite` that may be used to send query to sqlite file database and get results as JavaScript object (de-serialized JSON).


## How to Use

1. Add contents of [User.js](User.js) into your test's `User.js`.
2. Copy [tools](tools) sub-folder into your test.

## Using with JavaScript
```javascript
	var query = "select * from tbl1;";
	var dbPath = Global.GetFullPath("%WORKDIR%\\mydb1");
	var queryResult = QuerySQLite(dbPath, query);
	Tester.Message("Query Returned: "+queryResult.length+" rows");
```
