//Use 'Record/Learn' button to begin test recording

function Test(params)
{
	var module = { exports: {}};
	var cssSelectors = true;
	
	var inputFiles = File.Find(".\\Input", "*.js");
	inputFiles = inputFiles.split("\n");
	
	for(var i = 0; i < inputFiles.length; i++)
	{
		var inputFile = inputFiles[i];
		if (File.Exists(inputFile))
		{
			var objectRepository = {};
			var pathSegments = inputFile.split("\\");
			var pageName = pathSegments[pathSegments.length - 1].replace(".js", "");
			
			Tester.Message("Procesing " + pageName);
			
			// Read input file
			var content = File.Read(inputFile);
			try
			{
				// should assign the object to module.exports
				eval(content);
			}
			catch(e)
			{
				Tester.Assert("Error parsing " + inputFile + ": " + e.message, false);
				continue;
			}
			
			// Convert
			for(var selectorName in module.exports)
			{
				var selectorValue = module.exports[selectorName];
				Tester.Message("Selector name: " + selectorName);
				Tester.Message("Selector value: " + selectorValue);
				
				///////////////////////////////////////////////////
				// create object description in Rapise format
				objectRepository[selectorName] = {
					"locations": [
						{
							"locator_name": "HTML",
							"location": {
								"xpath": "param:xpath",
								"url": "param:url",
								"title": "param:title"
							}
						}
					],
					"window_class": "Chrome_WidgetWin_1",
					"object_text": "Chrome Legacy Window",
					"object_role": "ROLE_SYSTEM_WINDOW",
					"object_class": "Chrome_RenderWidgetHostHWND",
					"version": 0,
					"object_type": "HTMLObject",
					"object_flavor": "Web",
					"object_name": selectorName,
					"ignore_object_name": true,
					"object_library": "Chrome HTML",
					"window_name": pageName,
					"xpath": cssSelectors ? "css=" + selectorValue : selectorValue,
					"title": pageName,
					"url": ""
				}
				//////////////////////////////////////////////////
			}

			// write output file
			var outputFile = ".\\Output\\" + pageName + ".objects.js";
			File.Write(outputFile, "var saved_script_objects=" + JSON.stringify(objectRepository, null, "\t") + ";");
		}
	}
}

