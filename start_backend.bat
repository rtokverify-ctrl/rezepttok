@echo off
cd backend
echo Starting Backend Server...
.\venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0
pause
