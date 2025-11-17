@echo off
setlocal

echo ==============================================
echo  Static Analysis Framework - Start Script
echo ==============================================
echo.

REM Quick checks
if not exist "mobsf-ui-backend\package.json" (
  echo [ERROR] mobsf-ui-backend not found. Run setup.bat first.
  pause
  exit /b 1
)

if not exist "mobsf-frontend\package.json" (
  echo [ERROR] mobsf-frontend not found. Run setup.bat first.
  pause
  exit /b 1
)

REM ------------------------------------------------
REM 1. Start backend in a new terminal
REM ------------------------------------------------
echo [STEP] Starting backend (npm run dev) in a new window...
pushd mobsf-ui-backend
start "MobSF Backend" cmd /k "npm run dev"
popd

REM ------------------------------------------------
REM 2. Start frontend in a new terminal
REM ------------------------------------------------
echo [STEP] Starting frontend (npm start) in a new window...
pushd mobsf-frontend
start "MobSF Frontend" cmd /k "npm start"
popd

REM ------------------------------------------------
REM 3. Open browser
REM ------------------------------------------------
echo [STEP] Opening http://localhost:3000 in your browser...
start "" "http://localhost:3000"

echo.
echo Backend and frontend are starting in separate terminal windows.
echo You can close this window, the app will keep running in those terminals.
echo.
pause
endlocal
