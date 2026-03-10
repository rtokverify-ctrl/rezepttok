@echo off
echo ============================================
echo    RezeptTok Test Suite
echo ============================================
echo.

cd /d "%~dp0backend"

:: Activate virtual environment
call venv\Scripts\activate.bat

:: Run all tests with verbose output
echo Running tests...
echo.
python -m pytest tests/ -v --tb=short

echo.
echo ============================================
echo    DONE
echo ============================================
pause
