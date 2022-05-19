![Download](https://github.githubassets.com/images/icons/emoji/unicode/23ec.png?v8) [Download Now](https://inflectra.github.io/DownGit/#/home?url=https://github.com/Inflectra/rapise-powerpack/tree/master/ZipFileItems)

# ZipFileItems
This sample contains a function `pathToZipFile` that may be used to read list of contents from the .zip file.


## How to Use
Add contents of [User.js](User.js) into your test's `User.js`.

## Using with JavaScript
```javascript
	var pathToZipFile = Global.GetFullPath('%WORKDIR%\\Reports.zip');
	var itemsArray = ZipFileItems(pathToZipFile);
```
