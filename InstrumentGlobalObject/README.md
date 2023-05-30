![Download](https://github.githubassets.com/images/icons/emoji/unicode/23ec.png?v8) [Download Now](https://inflectra.github.io/DownGit/#/home?url=https://github.com/Inflectra/rapise-powerpack/tree/master/InstrumentGlobalObject)

# Customizing Global Objects

In this sample we have a library with 2 global objects (GOO and GOO2) defined in a library "LibUsefulObjects"

Then in User.js we have a function:

```javascript
function SeSGlobalObjectInstrument(ids, cb) {...}
```

and call to this function:

```javascript
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
```

This instrumentation adds report messages before and after each call to a method of the global object.

## Usage

Copy contents from [User.js](User.js) into your `User.js` or shared/common file.

Change `SeSGlobalObjectInstrument(["GOO","GOO2"],...)` to your global object ids.

