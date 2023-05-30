//Put your custom functions and variables in this file

function SeSGlobalObjectInstrument(ids, cb) {
	if(global.g_recording) return;
	if ( typeof(ids)=="string" ) ids = [ids];
	for(var idind in ids) {
		var id = ids[idind];
		var obj = global[id];
		if(obj) {
			for(var m in obj) {
				var p = obj[m];
				if( typeof(p)=='function' && m.indexOf('_')!=0 ) {
					// Got method p named m
					obj['_i_'+m] = p;
					obj[m] = cb(obj, id, m, p);
					Log("Done instrumenting: "+id+"."+m);
				}
			}
		}
	}
}

SeSOnTestInit( function(){
	SeSGlobalObjectInstrument(["GOO","GOO2"], function(self,id,name,fn) {
		return function() {
			Tester.Assert("Calling "+id+"."+name, true);
			var res = self["_i_"+name].apply(fn, arguments);
			Tester.Assert("Done Calling "+id+"."+name, true, res);
			return res;
		}
	});
	}
);
