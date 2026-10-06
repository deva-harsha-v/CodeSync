@echo off
TITLE CodeSync Platform Launch Suite
echo =================================================================
echo   STARTING CODESYNC: AI-ASSISTED REAL-TIME COLLABORATIVE CODE SYNC
echo =================================================================

echo [1/3] Starting Python ML Service on http://127.0.0.1:8000...
start "CodeSync ML Service" cmd /k "cd /d %~dp0..\ml-service && python app/main.py"

timeout /t 2 /nobreak >nul

echo [2/3] Starting Backend Server on http://localhost:5000...
start "CodeSync Backend" cmd /k "cd /d %~dp0..\backend && npm start"

timeout /t 2 /nobreak >nul

echo [3/3] Starting Frontend Dev Server on http://localhost:3000...
start "CodeSync Frontend" cmd /k "cd /d %~dp0..\frontend && npm run dev"

echo =================================================================
echo   All services have been launched in separate terminal windows!
echo   Frontend IDE: http://localhost:3000
echo   Backend REST: http://localhost:5000
echo   ML Service:   http://127.0.0.1:8000
echo =================================================================
pause
