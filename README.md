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
REM 2. Check npm
REM ----------------------------------------------------
echo [STEP] Checking npm...
npm -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not available.
    echo         Reinstall Node.js (it should include npm) and try again.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('npm -v') do set NPM_VER=%%v
echo [OK] npm version: !NPM_VER!
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
REM 6. Check Docker and guide user to run MobSF container
REM ----------------------------------------------------
echo [STEP] Checking Docker CLI...
docker -v >nul 2>&1
if errorlevel 1 (
    echo [WARN] Docker is not installed or not in PATH.
    echo        MobSF requires Docker. Install Docker Desktop later.
    echo        You can still continue and set API key manually.
    echo.
) else (
    for /f "tokens=1,2*" %%a in ('docker -v') do set DOCKER_VER=%%a %%b
    echo [OK] Docker detected: !DOCKER_VER!
    echo.
    echo [STEP] Checking Docker daemon...
    docker info >nul 2>&1
    if errorlevel 1 (
        echo [WARN] Docker daemon is not running.
        echo        Start Docker Desktop before using MobSF.
        echo        You can still continue and run these commands later:
        echo          docker pull opensecurity/mobile-security-framework-mobsf:latest
        echo          docker run -it --rm -p 8000:8000 opensecurity/mobile-security-framework-mobsf:latest
        echo.
    ) else (
        echo [OK] Docker daemon is running.
        echo.
        echo ====================================================
        echo  IMPORTANT: Setup MobSF Docker (run these ONCE)
        echo ====================================================
        echo Open a NEW terminal window and execute:
        echo.
        echo   docker pull opensecurity/mobile-security-framework-mobsf:latest
        echo   docker run -it --rm -p 8000:8000 opensecurity/mobile-security-framework-mobsf:latest
        echo.
        echo Then:
        echo   1) Wait for MobSF to start
        echo   2) Open http://localhost:8000 in your browser
        echo   3) Login ^(default credentials if new install^)
        echo   4) Go to: Settings -^> Security
        echo   5) COPY the "MobSF REST API Key"
        echo.
        echo After you have copied the API key, return to THIS window.
        pause
    )
)

REM ----------------------------------------------------
REM 7. Ask for MobSF API key and create .env
REM ----------------------------------------------------
echo.
echo [STEP] Configure MobSF API key
echo Paste the MobSF REST API key you copied from:
echo   http://localhost:8000  -> Settings -> Security
echo.

set "MOBSF_API_KEY="
set /p MOBSF_API_KEY=Enter MobSF REST API key and press ENTER: 

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
echo   1) Make sure MobSF container is running 
echo      (docker run -it --rm -p 8000:8000 opensecurity/mobile-security-framework-mobsf:latest)
echo   2) Then run:  start.bat
echo      This will start:
echo        - Backend on http://localhost:4000
echo        - Frontend on http://localhost:3000
echo.
pause
endlocal
exit /b 0
