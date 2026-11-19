@echo off
setlocal enabledelayedexpansion

echo ===================================================================
echo   Smart Traffic Signal Controller Using an Instruction-Level CPU
echo   Starting Backend Server & Vite Frontend Dashboard
echo ===================================================================
echo.

:: 1. Check Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is NOT installed or not found in system PATH.
    pause
    exit /b 1
)

node -e "if(Number(process.versions.node.split('.')[0])<24)process.exit(1)"
if %errorlevel% neq 0 (
    echo [ERROR] Node.js 24 or newer is required.
    pause
    exit /b 1
)

:: 2. Launch Backend in separate window
echo [*] Starting Backend Express & Socket.IO server on http://localhost:5000 ...
start "Smart-Traffic-Backend" cmd /k "cd /d "%~dp0\..\backend" && npm start"

:: Give backend a moment to start
timeout /t 2 /nobreak >nul

:: 3. Launch Frontend Vite Dev Server in separate window
echo [*] Starting Frontend React & Vite dashboard on http://localhost:5174 ...
start "Smart-Traffic-Frontend" cmd /k "cd /d "%~dp0\..\frontend" && npm run dev"

:: Give frontend a moment to spin up
timeout /t 3 /nobreak >nul

:: 4. Open default browser
echo [*] Opening dashboard in your default browser...
start http://localhost:5174

echo.
echo ===================================================================
echo [ONLINE] Application is running!
echo   - Frontend: http://localhost:5174
echo   - Backend:  http://localhost:5000
echo   - Health:   http://localhost:5000/health
echo.
echo Leave the backend and frontend terminal windows open.
echo Close those windows to stop the servers.
echo ===================================================================
echo.
pause
