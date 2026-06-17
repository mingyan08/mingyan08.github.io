@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% equ 0 (
  node "tools\build-site.js"
  pause
  exit /b %errorlevel%
)

set "NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if not exist "%NODE%" (
  echo Node.js was not found.
  echo Install Node.js, or run this build from Codex where the bundled Node runtime is available.
  pause
  exit /b 1
)

"%NODE%" "tools\build-site.js"
pause
