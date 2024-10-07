// Put library code here


/**#@+
   @library ClassButton
*/

/** @rule */
SeSRegisterRule({
	rule_id:"ClassButtonRule",

	object_type: "ClassButton",
	object_flavor: "Button",

	extend_rule: "HTMLObject",
	dont_hash: true,

	/** @behaviors */
	behavior: ["ClassButtonBehavior"]
});

/** @behavior */
SeSRegisterBehavior({
	id:"ClassButtonBehavior",

	actions: [
		{
			actionName: "Press",
			/** @action */
			DoAction: ClassButtonBehavior_DoPress
		}
	],
	properties:
	{
		/** @property */
		ClassType:
		{
			Get: ClassButtonBehavior_GetClassType
		}
	}
}); // ClassButtonBehavior

function ClassButtonBehavior_DoPress(/**number*/ xOffset, /**number*/ yOffset,/**string*/ clickType)
{
	var b = /**HTMLObject*/this;
	
	if(clickType=="LD") {
		b._DoLDClick(xOffset,yOffset)
	} else if(clickType=="R") {
		b._DoRClick(xOffset,yOffset);
	} else {
		return b._DoClick(xOffset,yOffset);
	}
	
	return false;
}

function ClassButtonBehavior_GetClassType()
{
	var cls = this.GetClass();
	// Extract class name like class1, class2 etc
	return cls;
}

ClassButtonsPlugin = 
{
	pluginId: "ClassButtonsPlugin",
	include: "Lib/LibClassButtons/LibClassButtonsRecorder.js",
	attachFunctionName: "ClassButtonsPluginAttach",
	Init: function()
	{
		return true; //Plugin initialized
	}
} 
