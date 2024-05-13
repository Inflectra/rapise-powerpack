# Using OnSave.cmd

This sample demonstrate usage of `OnSave.cmd` callback.

`OnSave.cmd` is in the root of the testing framework. When the file is there, each time someone modifies or adds one of framework files, the file is executed.


## Usage

The most straight-forward usage of [OnSave.cmd](OnSave.cmd) is git auto-save. It helps to track all the intermediate changes in the files and reduces the threat of unsaved/corrupted file loss.

It is recommended to be used together with [.gitignore](.gitignore).

Here is how [OnSave.cmd](OnSave.cmd) implemented in this example:

```cmd
git add * >>gitadd.log
git commit -a -m "Autosave" >>gitcommit.log
```

## How to Try

You may try this framework yourself. Simply clone the whole repository https://github.com/Inflectra/rapise-powerpack, then open `rapise-powerpack\FWOnSaveDemo\Framework.sstest` using Rapise. Try adding test cases, files, editing files etc. See how all your changes are tracked.
