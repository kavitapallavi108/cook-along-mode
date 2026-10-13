@echo off
rem Double-click to start Cook-Along Mode at http://localhost:5173
cd /d "%~dp0"
start "" cmd /c "timeout /t 2 >nul & start http://localhost:5173"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
