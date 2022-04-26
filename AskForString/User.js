
function AskForString(prompt, defValue)
{
	var data = {"Value":defValue};
	var schema = {
	"num": {
	    "_primitive": true,
	    "_pattern_container": false,
	    "_may_add_fields": false
	},
	"int": {
	    "_primitive": true,
	    "_pattern_container": false,
	    "_may_add_fields": false
	},
	"bool": {
	    "_primitive": true,
	    "_pattern_container": false,
	    "_may_add_fields": false
	},
	"object": {
	    "_may_add_fields": true
	},
	"string": {
	    "_primitive": true,
	    "_pattern_container": false,
	    "_may_add_fields": false
	},
	"password": {
	    "_primitive": true,
	    "_pattern_container": false,
	    "_may_add_fields": false
	},
	"Root": {
	    "Root": {
	        "expectedType": "RootConfigObject"
	    }
	},
	"RootConfigObject": {
	    "$$":
	    {
	      "category": "Other",
	      "expectedType": "string"
	    },
	    "_may_add_fields": true
	}
	};
	var c = new ActiveXObject("Rapise.ConfigPrompt");
	c.Prepare(prompt, prompt, "Press OK to proceed", "OK", "Cancel");
	var strData = JSON.stringify(data);
	var strSchema = "var _SeSJsonEditorSchema =" + JSON.stringify(schema);
	var res = c.ShowPromptJson(strData, strSchema);
	if(res)
	{
		return JSON.parse(res).Value;
	}
	return null;
}
