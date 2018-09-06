# GetLatestFile

This function finds newest file in the folder.

## Usage

Copy the function to User javascript file or any other common file you include in every test.

## Usage Scenario

Consider the following use case.

Click on web site causes file download by the browser. File name is dynamic (or, browser may change it when downloading). So what you need is to just get path to newest file in the downloads folder.

````
var filePath = GetLatestFile('%USERPROFILE%\\Downloads')
````

Should do the trick. Then you may access the file and its properties using global `File` object.

