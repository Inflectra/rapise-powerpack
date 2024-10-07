// Whatever should be accessible from within Browser is here
// this corresponds to a related browser object.
function ClassButtonsPluginAttach(browser, actionHolder)
{
	if(l2) Log2("ClassButton Plugin Initializing");
	// Context (object information) about object to be executed
	var browserObject = browser;
	
	// return codes of functions
	var R_NOT_OBJECT = 0; // if is not object of this kind
	var R_ACTION_FOUND = 1; // all is ok, object and action found
	var R_OBJECT_FOUND = 2; // this is object of this kind, but action is unknown
	
	
	// tree item state
	var TI_EXPANDED = 0;
	var TI_COLLAPSED = 1;
	var TI_NOCHILDREN = 2;
	
	if(typeof(console) == "undefined") 
	{
		// Install dummy functions, so that logging does not break the code if console is not present
		var console = {};
		console.log = function(msg){};
		console.info = function(msg){};
		console.warn = function(msg){};
	}
	else 
	{
		// console.log provided
	}
	
	//////////////////////////////////////////////////////////////////////
	/// region of recorder functions, all other functions must be upper
	//////////////////////////////////////////////////////////////////////
	
	function IsClassButton(evt,element,eventOpts,objName,description, flavor, items)
	{
		console.log("IsClassButton called");
		var rvalue = 
		{
			root: null, // to define in future the most near element or smth else
			result: null, // here will be old res placed
			rcode: R_NOT_OBJECT // return code
		};
		
		var classButton = __hasAttr(element, 'class', /class\d+($|\s)/ig);

		if(classButton)
		{
			root = element;
			var res = {
				cancel: false,
				object_flavor: 'Button',
				object_name: "ClassButton",
				object_type: 'ClassButton',
				description: 'Class N Button',
				locator_data: 
				{
					xpath: SeS_GenerateXPath(root)
				}
			};
	
			// Learn
			rvalue.result = res;
			rvalue.root = root;
			rvalue.rcode = R_OBJECT_FOUND;
			
			if(evt == "resolveElementDescriptor")
			{
				res.rect = __getElementRect(root);
				res.action = undefined;
				return rvalue;
			}
			
			if (evt == "Click")
			{
				var actionPress = {
						name: "Press",
						description: "Press the button",
						params: []
					};	
				res.action = actionPress;
			}
		
			// Actions 
			rvalue.rcode = R_ACTION_FOUND;
		}
		
		return rvalue;
	}
	
	actionHolder.OnActionRecorded = function(evt,element,eventOpts,objName,description, flavor, items)
	{
		console.log("ClassButton recorder");
		if(!element) return false;
		function _checkClassButtonControls()
		{
			var r = manageExceptions(IsClassButton)(evt,element,eventOpts,objName,description, flavor, items);
			if(r.rcode == R_OBJECT_FOUND || r.rcode == R_ACTION_FOUND)
			{
				return r.result;
			}
		}
		
		if(typeof(g_debug)!="undefined"&&g_debug)
		{
			return _checkClassButtonControls();
		} 
		else
		{
			try
			{
				return _checkClassButtonControls();
			}
			catch(exc)
			{
				PrintException("ClassButton Plugin exception", exc);
			}
		}
		return false;
	}
	
	//#region Debug Functions
	function PrintException(title, exc)
	{
		Log("************** " + title + " *********************\n");
		var vDebug = "";
		for (var prop in exc)
		{
			vDebug += "    ["+ prop+ "]:"+ exc[prop] + "\n";
		}
		Log(vDebug);
		Log('**********************************************************');	
	}

	function print(msg) 
	{
		console.log(msg); // to see it in console if possible
		if(l1)Log1(msg);
	}

	function manageExceptions(func) 
	{
		var orignal = func;
		var decorated = function() 
		{
			// purpose of this wrap is to write function name where error is, if stack is unavailable
			function functionName(fn)
			{
				var name = /\W*function\s+([\w\$]+)\(/.exec(fn);
				if(!name)
				{
					return 'No name';
				}
				return name[1];
			}
			var funcName = functionName(orignal.toString());
			
			if(typeof(g_debug)!="undefined"&&g_debug)
			{
				var _s = new Date();
				if(l3) Log3("Trying:"+funcName);
				var res = orignal.apply(this, arguments);
				if(l3) Log3( (new Date()-_s)+"[ms]" );
				return res;
			} else {
				try 
				{
					return orignal.apply(this, arguments);
				}
				catch(exception) 
				{
					if (!exception.stack) // give user more chances to find out error
					{
						Log("************** Exception in " + funcName + " *********************\n");
					}
					throw exception; // to catch it in the end of recorder
				}
			}			
		}
		return decorated;
	}
	//#endregion
}
