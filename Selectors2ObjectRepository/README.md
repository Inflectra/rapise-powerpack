# Object Repository Converter

In this example you will find a conversion function. It reads Selenium selectors from `*.js` files located in `Input` folder and produces `*.objects.js` files in `Output` folder. Converted files are in Rapise Object Repository format.

There are two sub-tests implementing page objects for Home and Login in [Library Information System](http://libraryinformationsystem.org/) demo application. They reference corresponding `*.objects.js` files from `Output` folder.

`LIS_Login` is a test case and uses `PO_Home` and `PO_Login` sub-tests.