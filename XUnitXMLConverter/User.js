//Put your custom functions and variables in this file

function ImportXUnitReportProperties(node)
{
	var txt="<pre>";
	for(var i=0;i<node.childNodes.length;i++)
	{
		var cn = node.childNodes[i];
		var n = cn.getAttribute('name');
		var v = cn.getAttribute('value');
		txt+=n+"="+v+"\r\n";
	}
	txt += "</pre>";
	
	return new SeSReportText(txt, "Properties");
}

function ImportXUnitReport(/**string*/path, /**boolean*/includeProperties)
{
	var defPath = path;
    if(!File.Exists(path))
    {
        path = Global.GetFullPath(path);
        
        if(!File.Exists(path))
        {
        	Tester.Assert('Unable to locate XML', false, defPath);
        }
    }

    var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
	//Turns off asynchronized loading, to make sure that the parser will not continue execution of the script
    //before the document is fully loaded.       
    xmlDoc.async = false;
    //Loads an XML document into xmlDoc object.
    xmlDoc.load(path);
    
    var tss = xmlDoc.documentElement.selectNodes("//testsuite");
    
    for (var i=0; i<tss.length; i++)
    {
    	var ts = tss[i];
    	
    	if( ts.tagName == "properties") 
    	{
    		if(includeProperties)
    		{
				var pdata = ImportXUnitReportProperties(ts);
				Tester.Message('Properties', [pdata]);
    		}
		} else {
			var tsName = ts.getAttributeNode("name").nodeValue;
			Log("TS: "+tsName);
			
			var tsFailures = parseInt(ts.getAttribute("failures")||0);
			var tsErrors = parseInt(ts.getAttribute("errors")||0);
			var tsSkipped = parseInt(ts.getAttribute("skipped")||0);
			var tsTests = parseInt(ts.getAttribute("tests")||0);
			var tsTime = ts.getAttribute("time")||"";
			Log("errors", tsErrors, "failures", tsFailures, "skipped", tsSkipped, "tests", tsTests);
			
			Tester.BeginTest(tsName);
			var pdata = [];
			
			for(var j=0;j<ts.childNodes.length;j++)
			{
				var tc = ts.childNodes[j];
				
				
				if( tc.tagName=="properties" )
				{
					var prop = ImportXUnitReportProperties(tc);
					pdata.push(prop);
				} else if( tc.tagName=="testcase" ) {
					var tcFailures = parseInt(tc.getAttribute("failures")||0);
					var tcErrors = parseInt(tc.getAttribute("errors")||0);
					var tcSkipped = parseInt(tc.getAttribute("skipped")||0);
					var tcTests = parseInt(tc.getAttribute("tests")||0);
					var tcTime = parseFloat(tc.getAttribute("time")||0);
					
					var tcName = tc.getAttributeNode("name").nodeValue;
					Log("TS: "+tcName);
					Log("errors", tcErrors, "failures", tcFailures, "skipped", tcSkipped, "tests", tcTests);
					var bSkip = tcSkipped>0;
					
					for( var k=0;k<tc.childNodes.length;k++ )
					{
						var ti = tc.childNodes[k];
						if( ti.tagName=="failure" )
						{
							var msg = ti.getAttribute("message")||"Failure";
							var txt = ""+(ti.nodeValue||ti.text);
							
							pdata.push( new SeSReportText( txt, msg ) );
						} else if( ti.tagName=="skipped" ) {
							pdata.push( new SeSReportText( "Skipped" ));
							bSkip = true;
						} else {
							pdata.push( new SeSReportText( ""+ti.nodeValue ));
						}
					}
					
					if(bSkip)
					{
						Tester.Message(tcName, pdata);
					} else {
						Tester.Assert(tcName, (tcErrors+tcFailures)==0, pdata);
						pdata = [];
					}
					
				} else {
					Log("Unexpected tag in testsuite: "+tc.tagName);
				}
				
				
			}
			
			
			Tester.EndTest("errors: "+tsErrors+" failures: "+ tsFailures + " skipped: " + tsSkipped + " tests: " + tsTests + " time: " + tsTime);
		}
	}
}


