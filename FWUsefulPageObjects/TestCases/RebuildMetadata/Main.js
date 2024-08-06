//Use 'Record/Learn' button to begin test recording

function Test(params)
{
	var res = {};
	SeSEachFile( '%WORKDIR%Lib/LibFramework/', '*.metadata', function(f) {
		var m = JSON.parse(File.Read(f));
		for(var id in m) {
			res[id]=m[id];
			res[id].url = "https://github.com/Inflectra/rapise-powerpack/tree/master/FWUsefulPageObjects/PageObjects/"+id;
		}
	});
	
	var path = '%WORKDIR%PageObjects/Public.json';
	File.Delete(path);
	File.Write(path, JSON.stringify(res,null,'\t'));
	Tester.Assert("Public.json has been regenerated", File.Exists(path));
}

g_load_libraries=[]

