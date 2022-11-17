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
        node.exe "%~dp0node_modules\eslint\bin\eslint.js"  --config "%~dp0.eslintrc.json" -f visualstudio --fix %1 -o %~dp0lint.log
        
        if ERRORLEVEL 1 (
          @type %~dp0lint.log >&2
        ) else (
          echo Beautifying... %1
          node.exe "%~dp0node_modules\js-beautify\js\bin\js-beautify.js" -r --config "%~dp0jsbeautify.config.json" %1 >>OnTextSaved.log 2>&1
        )
    )
)
