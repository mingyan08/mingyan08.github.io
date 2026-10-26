@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Optional offline previews require Node.js.
  echo Editing and committing Markdown on GitHub does not require this step.
  exit /b 1
)

node "tools\build-site.js"
set "SITE_BUILD_EXIT=%errorlevel%"
exit /b %SITE_BUILD_EXIT%
