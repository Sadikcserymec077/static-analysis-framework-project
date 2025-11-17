@echo off
title Static Analysis Framework - Setup
setlocal ENABLEDELAYEDEXPANSION

echo ====================================================
echo  Static Analysis Framework - First-time Setup
echo ====================================================
echo.

REM ----------------------------------------------------
REM 1. Check Node.js
REM ----------------------------------------------------
echo [STEP] Checking Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo         Install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [OK] Node.js version: !NODE_VER!
echo.


REM ----------------------------------------------------
REM 3. Install backend dependencies
REM ----------------------------------------------------
if not exist "mobsf-ui-backend\package.json" (
    echo [ERROR] mobsf-ui-backend\package.json not found.
    echo         Make sure you cloned the repo correctly.
    pause
    exit /b 1
)

echo [STEP] Installing backend dependencies (mobsf-ui-backend) ...
cd /d mobsf-ui-backend
call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed in mobsf-ui-backend.
    cd /d ..
    pause
    exit /b 1
)
cd /d ..
echo [OK] Backend dependencies installed.
echo.

REM ----------------------------------------------------
REM 4. Install frontend dependencies
REM ----------------------------------------------------
if not exist "mobsf-frontend\package.json" (
    echo [ERROR] mobsf-frontend\package.json not found.
    echo         Make sure you cloned the repo correctly.
    pause
    exit /b 1
)

echo [STEP] Installing frontend dependencies (mobsf-frontend) ...
cd /d mobsf-frontend
call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed in mobsf-frontend.
    cd /d ..
    pause
    exit /b 1
)
cd /d ..
echo [OK] Frontend dependencies installed.
echo.

REM ----------------------------------------------------
REM 5. Create reports/json and reports/pdf folders
REM ----------------------------------------------------
echo [STEP] Preparing reports folders...
if not exist "mobsf-ui-backend\reports" mkdir "mobsf-ui-backend\reports"
if not exist "mobsf-ui-backend\reports\json" mkdir "mobsf-ui-backend\reports\json"
if not exist "mobsf-ui-backend\reports\pdf" mkdir "mobsf-ui-backend\reports\pdf"
echo [OK] reports/json and reports/pdf are ready.
echo.

REM ----------------------------------------------------
REM 6. Check Docker (optional, only to warn)
REM ----------------------------------------------------
echo [STEP] Checking Docker CLI...
docker -v >nul 2>&1
if errorlevel 1 (
    echo [WARN] Docker is not installed or not in PATH.
    echo        MobSF requires Docker. Install Docker Desktop later.
) else (
    for /f "tokens=1,2*" %%a in ('docker -v') do set DOCKER_VER=%%a %%b
    echo [OK] Docker detected: !DOCKER_VER!
    echo [STEP] Checking Docker daemon...
    docker info >nul 2>&1
    if errorlevel 1 (
        echo [WARN] Docker daemon is not running.
        echo        Start Docker Desktop before using MobSF.
    ) else (
        echo [OK] Docker daemon is running.
    )
)
echo.

REM ----------------------------------------------------
REM 7. Ask for MobSF API key and create .env
REM ----------------------------------------------------
echo [STEP] Configure MobSF API
echo run below commands in separate windows terminal
echo first run this command
echo docker pull opensecurity/mobile-security-framework-mobsf
echo then this command
echo docker run -it -p 8000:8000 opensecurity/mobile-security-framework-mobsf
echo copy the REST api key shown in terminal
echo.

set "MOBSF_API_KEY="
set /p MOBSF_API_KEY=Paste your MobSF API key and press ENTER: 

if "%MOBSF_API_KEY%"=="" (
    echo [ERROR] API key cannot be empty.
    pause
    exit /b 1
)

echo [STEP] Writing mobsf-ui-backend\.env ...
(
    echo MOBSF_URL=http://localhost:8000
    echo MOBSF_API_KEY=%MOBSF_API_KEY%
    echo PORT=4000
) > "mobsf-ui-backend\.env"
echo [OK] .env file created/updated.
echo.

REM ----------------------------------------------------
REM 8. Final instructions
REM ----------------------------------------------------
echo ====================================================
echo  Setup completed successfully.
echo ====================================================
echo.
echo Next steps:
echo   1) Make sure MobSF Docker container is running.
echo      For example, in another terminal you can run:
echo.
echo         docker pull opensecurity/mobile-security-framework-mobsf
echo         docker run -it -p 8000:8000 opensecurity/mobile-security-framework-mobsf
echo.
echo   2) Then run:  start.bat  (this will start backend and frontend)
echo.
pause
endlocal
exit /b 0
