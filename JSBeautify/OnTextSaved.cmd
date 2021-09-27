@echo off
@rem We only format .js files.
@rem %1 - file path
@rem %2 - test working directory
@rem %SHIFT_PRESSED% is "yes" when user presses Shift key
@rem %CONTROL_PRESSED% is "yes" when user presses Ctrl key
@rem Beautifier configuration may be changed here: https://beautifier.io/ and saved
@rem into beautify.config.json

if "%SHIFT_PRESSED%"=="yes" (
    if "%~x1"==".js" (
        @call "%~dp0node_modules\.bin\js-beautify.cmd" -r --config "%~dp0jsbeautify.config.json" %1 >OnTextSaved.log 2>&1
    )
)
