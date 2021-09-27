# OnTextSave.cmd

This test framework contains pre-configured JS beautifier.

This test has `OnTextSaved.cmd` in the root. It gets called by Rapise every time the text file is saved in the editor.

`OnTextSaved.cmd` checks if file extension is `.js` and then calls the beautifier.

In this example, the beautifier is an `npm` module checked out into the framework root. In general it could call any script or utility installed to the PC (either global `npm` module or executable).
