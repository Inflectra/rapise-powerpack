@echo off
setlocal

set "PROC=olk.exe"
set "DEBUG_PORT=19314"

REM Is olk.exe running?
tasklist /FI "IMAGENAME eq %PROC%" | find /I "%PROC%" >nul
if errorlevel 1 (
    echo %PROC% is not running. Starting a new instance...
    goto :start_olk
)

REM olk.exe is running. Check whether port 9222 is already listening.
powershell -NoProfile -Command ^
  "$listening = Get-NetTCPConnection -State Listen -LocalPort %DEBUG_PORT% -ErrorAction SilentlyContinue; if ($listening) { exit 0 } else { exit 1 }"
if not errorlevel 1 (
    echo %PROC% is already running with remote debugging on port %DEBUG_PORT%. Nothing to do.
    goto :eof
)

echo %PROC% is running, but remote debugging port %DEBUG_PORT% is not active.
echo Killing existing instance...

taskkill /IM %PROC% /F >nul 2>&1

:start_olk
echo Starting %PROC% with WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=%DEBUG_PORT%
set "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=%DEBUG_PORT%"
start "" "%PROC%" -devtools

endlocal