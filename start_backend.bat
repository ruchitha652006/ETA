@echo off
echo ============================================
echo   RailETA - Starting Backend (FastAPI)
echo ============================================
echo.
cd /d "%~dp0backend"
echo Starting FastAPI server on http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
