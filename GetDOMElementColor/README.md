# Reading DOM Element Color

Sometimes we need to get runtime property for the element. For example, we need to get a background color to know that element is marked for a user.

Here is how it may be done with Rapise using [Navigator.ExecJS](https://rapisedoc.inflectra.com/Libraries/Navigator/#execjs).

## In JavaScript

```javascript
	// Element should be passed as 2nd parameter to Navigator.ExecJS
	var el = SeS('Library_Information_System');
	// The JS gets executed in the web page context. If you need to return something, you need to assign it to `execResult` variable:
	var bc = Navigator.ExecJS("execResult= window.getComputedStyle( el,null).getPropertyValue('background-color'); ", el);
	
	Tester.Message("Background Color: "+bc);
```

## In RVL

[!RVL](img/getbgcolor.png)

```
#	Read background color for the element							
#	1. Use DoWaitFor - the side effect is to assign found element to LastResult variable							
	Action	Global	DoWaitFor	objectId	objectid	Library_Information_System		
#	2. Call Navigator.ExecJS - watch 2nd parameter - it is an element returned from DoWaitFor							
	Action	Navigator	ExecJS	scriptText	string	execResult= window.getComputedStyle( el,null).getPropertyValue('background-color');		
	Param			el	variable	LastResult		
#	3. Assign returned value (execResult=...) to BgColor variable							
	Variable			BgColor	variable	LastResult		
#	4. Output the value of BgColor							
	Action	Tester	Message	message	string	BgColor:		
	Param			message	variable	BgColor		

```

