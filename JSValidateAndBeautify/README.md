![Download](https://github.githubassets.com/images/icons/emoji/unicode/23ec.png?v8) [Download Now](https://inflectra.github.io/DownGit/#/home?url=https://github.com/Inflectra/rapise-powerpack/tree/master/JSValidateAndBeautify)

# OnTextSave.cmd

This test framework contains pre-configured JS linter and beautifier.

This test has `OnTextSaved.cmd` in the root. It gets called by Rapise every time the text file is saved in the editor while SHIFT key is pressed.

`OnTextSaved.cmd` checks if file extension is `.js` and then calls the beautifier.

In this example, the beautifier is an `npm` module checked out into the framework root. In general it could call any script or utility installed to the PC (either global `npm` module or executable).

# Enable for All Projects

You may deploy the beutifier globally so it is available for all projects as follows:

1. Copy `node_modules`, `jsbeautify.config.json`, `OnTextSaved.cmd` into `c:\Users\Public\Documents\Rapise` folder. I.e.:

![OnTextSaved](./img/OnTextSaved.png)

