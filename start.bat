@echo off
title Smart Traffic Signal Controller - Virtual CPU (COA)
color 0B
echo ==============================================================================
echo     SMART TRAFFIC SIGNAL CONTROLLER USING AN INSTRUCTION-LEVEL VIRTUAL CPU
echo ==============================================================================
echo.
echo [*] Freeing port 5000 if occupied...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

echo [*] Starting Backend Server & Web Dashboard on http://localhost:5000 ...
start http://localhost:5000
cd /d "%~dp0\backend"
node src/server.js
pause
