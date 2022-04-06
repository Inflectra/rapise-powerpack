
function GetDOMElementProperty(/**objectId*/objectIdOrXPath, /**string*/propName)
{
	var /**HTMLObject*/obj = null;
	if( typeof objectIdOrXPath=='string')
	{
		obj = Navigator.SeSFind(objectIdOrXPath)
	} else {
		obj = objectIdOrXPath;
	}
	
	if( obj )
	{
		return Navigator.ExecJS('execResult = window.getComputedStyle(el, null).getPropertyValue("'+propName+'");', obj);
	} else {
		Tester.Assert('GetHtmlProp: object not found: '+objectIdOrXPath, false);
	}
	return null;
}