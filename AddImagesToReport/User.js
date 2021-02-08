//Put your custom functions and variables in this file

function AddImagesToReport(/**string*/message, /**string*/path)
{
	var data = []
	if(path instanceof Array)
	{
		for(var i=0;i<path.length;i++)
		{
			var p = path[i];
			
			var img = new ActiveXObject("SeSWrappers.Utils.ImageWrapper");
			if(!File.Exists(p))
			{
				p = Global.GetFullPath(p);
			}
			p = Global.GetFullPath(g_helper.ResolveEnvironmentVariables(p));
			img.Load(/**String*/p)
			data.push(new SeSReportImage(img, message));
		}
	} else {
		var p = path;
		var img = new ActiveXObject("SeSWrappers.Utils.ImageWrapper");
		p = Global.GetFullPath(g_helper.ResolveEnvironmentVariables(p));
		img.Load(/**String*/p)
		data.push(new SeSReportImage(img, message));
	}

	Tester.Message(message, data);
}