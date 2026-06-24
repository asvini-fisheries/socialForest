@echo off
REM Run SocialForest dev server from the correct project root
cd /d "%~dp0.."

if not exist "src\app" (
  echo.
  echo ERROR: src\app not found in %CD%
  echo Run from: D:\sak\ApplicationDevelopment\socialForest
  echo Then: git pull origin develop
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
echo SocialForest project: %CD%
echo Starting http://localhost:4350
echo.

call npm install
call npm run dev
pause
