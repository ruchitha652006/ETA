@echo off
echo ============================================
echo   RailETA - Starting Frontend (Vite)
echo ============================================
echo.
cd /d "%~dp0frontend"
echo Starting Vite dev server on http://localhost:5173
echo.
npm run dev
