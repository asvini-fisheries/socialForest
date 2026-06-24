@echo off
REM Run SocialForest dev server — frees port 4350 first (Windows)
cd /d "%~dp0.."

if not exist "src\app" (
  echo.
  echo ERROR: src\app not found in %CD%
  echo Run from: D:\sak\ApplicationDevelopment\socialForest
  echo.
  pause
  exit /b 1
)

if not exist "package.json" (
  echo ERROR: package.json not found in %CD%
  pause
  exit /b 1
)

echo.
echo SocialForest: %CD%
echo Freeing port 4350 if in use...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4350" ^| findstr "LISTENING"') do (
  echo   Stopping PID %%a
  taskkill /PID %%a /F >nul 2>&1
)

timeout /t 2 /nobreak >nul

netstat -ano | findstr ":4350" | findstr "LISTENING" >nul
if %errorlevel%==0 (
  echo.
  echo ERROR: Port 4350 still in use. Run:
  echo   netstat -ano ^| findstr :4350
  echo.
  pause
  exit /b 1
)

echo Starting http://localhost:4350
echo.
call npm run dev
pause
