![Download](https://github.githubassets.com/images/icons/emoji/unicode/23ec.png?v8) [Download Now](https://inflectra.github.io/DownGit/#/home?url=https://github.com/Inflectra/rapise-powerpack/tree/master/IncludeFolder)

# Include All .js Files from Folder

Simple function that helps including bunch of .js files from a folder.

```javascript
function IncludeFolder(/**string*/folderPath)
```

# Using

To add a `IncludeFolder` object into your framework simply copy `IncludeFolder` implementation from [User.js](User.js) into your `User.js`.

# Example

```javascript
// Include all JS files from FolderName
IncludeFolder("%WORKDIR%/FolderName");
```