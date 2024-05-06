![Download](https://github.githubassets.com/images/icons/emoji/unicode/23ec.png?v8) [Download Now](https://inflectra.github.io/DownGit/#/home?url=https://github.com/Inflectra/rapise-powerpack/tree/master/FWSeSOnReportMessage)

# Using SeSOnReportMessage

This sample demonstrate usage of `SeSOnReportMessage` callback.

## Usage

SeSOnReportMessage is defined in Common.js. In its current implementation it dumps all report messages to file MyReport.txt. If it is a failure message, then, whenever possible, its source position is also saved.

Try running "FailingTestCase" and then check "MyReport.txt". Then run "PassingTestCase" and check it again to see the difference.