@echo off
setlocal enabledelayedexpansion

echo ===================================================================
echo   Smart Traffic Signal Controller Using an Instruction-Level CPU
echo   COA Academic Full-Stack Project Installation Script
echo ===================================================================
echo.

:: 1. Check Node.js
echo [*] Checking Node.js installation...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is NOT installed or not found in system PATH.
    echo Please install Node.js v24 or higher from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [OK] Node.js is installed (%NODE_VER%)

node -e "if(Number(process.versions.node.split('.')[0])<24)process.exit(1)"
if %errorlevel% neq 0 (
    echo [ERROR] Node.js 24 or newer is required.
    pause
    exit /b 1
)

:: 2. Check npm
echo [*] Checking npm installation...
call npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is NOT accessible.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('call npm -v') do set NPM_VER=%%v
echo [OK] npm is installed (%NPM_VER%)
echo.

:: 3. Install Backend Dependencies
echo [*] Installing backend dependencies...
cd /d "%~dp0\..\backend"
call npm ci
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies.
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed successfully.
echo.

:: 4. Install Frontend Dependencies
echo [*] Installing frontend dependencies...
cd /d "%~dp0\..\frontend"
call npm ci
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies.
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed successfully.
echo.

:: 5. Run Automated Tests
echo [*] Running automated COA test suite...
cd /d "%~dp0\..\backend"
call npm test
if %errorlevel% neq 0 (
    echo [ERROR] Tests failed. Installation verification is incomplete.
    pause
    exit /b 1
) else (
    echo [OK] All automated tests passed successfully!
)
echo.

echo ===================================================================
echo [SUCCESS] Installation and verification completed successfully!
echo You can now launch the application by running scripts\start.bat
echo ===================================================================
echo.
pause
