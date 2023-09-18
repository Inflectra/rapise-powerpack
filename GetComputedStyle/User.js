
function GetComputedStyle(/**objectid*/objectid,/**string*/optFieldName) {
	var obj = objectid;
	if(typeof obj=='string') {
		obj = Navigator.SeSFind(objectid);
	}
	
	var styleStr = Navigator.ExecJS("return JSON.stringify(window.getComputedStyle(arguments[0]))", obj);
	var json = JSON.parse(styleStr);
	
	if(json&&optFieldName) {
		return json[optFieldName];
	}
	if(json) {
		json.toString=function(){return JSON.stringify(this,null,'\t')}
	}
	return json;
}