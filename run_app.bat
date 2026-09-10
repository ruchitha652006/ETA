@echo off
setlocal enabledelayedexpansion
title RailETA - Live Train Tracking & Prediction App

echo =========================================================
echo              RailETA Application Launcher
echo =========================================================
echo.

:: 1. Check Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    pause
    exit /b 1
)

:: 2. Check Node
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

echo [*] Starting RailETA Backend (FastAPI on http://127.0.0.1:8000)...
start "RailETA Backend" /min cmd /c "cd /d "%~dp0backend" && python -m uvicorn main:app --host 127.0.0.1 --port 8000"

echo [*] Starting Frontend Server...
start "RailETA Frontend" /min cmd /c "cd /d "%~dp0frontend" && npm run dev"

echo [*] Waiting for services to initialize...
timeout /t 3 /nobreak >nul

echo [*] Launching RailETA Desktop Application Window...
:: Attempt to launch in dedicated standalone app window using Edge/Chrome app mode
where msedge >nul 2>nul
if %ERRORLEVEL% equ 0 (
    start msedge --app=http://localhost:5173 --window-size=1366,860
    goto launched
)

where chrome >nul 2>nul
if %ERRORLEVEL% equ 0 (
    start chrome --app=http://localhost:5173 --window-size=1366,860
    goto launched
)

:: Fallback to default browser
start http://localhost:5173

:launched
echo.
echo =========================================================
echo  RailETA is running!
echo  - Desktop App Window: Active
echo  - Backend API: http://127.0.0.1:8000/docs
echo  - Frontend:    http://localhost:5173
echo.
echo  To install on Android or iOS:
echo  1. Open http://<your-ip>:5173 on your mobile phone
echo  2. Click "Install App" in the top bar or "Add to Home Screen"
echo =========================================================
echo.
echo Keep this window open while using the app. Press any key to stop all services.
pause >nul

echo [*] Stopping RailETA services...
taskkill /F /FI "WINDOWTITLE eq RailETA Backend*" >nul 2>nul
taskkill /F /FI "WINDOWTITLE eq RailETA Frontend*" >nul 2>nul
echo Done.
