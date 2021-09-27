# Object Repository Converter

In this example you will find a conversion function. It reads Selenium selectors from `*.js` files located in `Input` folder and produces `Objects.js` files in `Output` folder. Converted files are in Rapise Object Repository format.

`LIS_Login` test uses converted object repositories `home.objects.js` and `login.objects.js`. The latter is loaded automatically because the test directly references it, the first is loaded with Global.DoLoadObjects in RVL.