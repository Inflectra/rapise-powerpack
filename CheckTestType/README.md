# Special Functions

Sometimes you need to have different logic depending on type test target. I.e. use `DoClick` in Selenium mode and `DoLClick` in native browser mode.

Simply copy one of these function from the [CheckTestType.js](CheckTestType.js ) into your `User.js` for this purpose:

```javascript
function IsMobileTest()

function IsSeleniumTest()

function IsAndroidTest()
```