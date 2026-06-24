@echo off
REM Fix Git remote + switch to develop (GitHub Desktop / Windows)
cd /d "%~dp0.."

echo.
echo SocialForest — Git / GitHub Desktop fix
echo Canonical path: D:\sak\ApplicationDevelopment\socialForest
echo Current folder: %CD%
echo.

git rev-parse --show-toplevel >nul 2>&1
if errorlevel 1 (
  echo ERROR: This folder is not a git repository.
  pause
  exit /b 1
)

for /f "delims=" %%i in ('git rev-parse --show-toplevel') do set GIT_ROOT=%%i
echo Git root: %GIT_ROOT%
echo.

echo [1/4] Setting remote URL...
git remote set-url origin https://github.com/asvini-fisheries/socialForest.git

echo [2/4] Fetching from origin...
git fetch origin --prune
if errorlevel 1 (
  echo ERROR: fetch failed. Sign in to GitHub Desktop and try again.
  pause
  exit /b 1
)

echo [3/4] Checking out develop...
git show-ref --verify --quiet refs/remotes/origin/develop
if errorlevel 1 (
  echo ERROR: origin/develop not found on GitHub.
  pause
  exit /b 1
)

git checkout develop 2>nul
if errorlevel 1 git checkout -b develop origin/develop

git branch --set-upstream-to=origin/develop develop

echo [4/4] Pulling latest develop...
git pull origin develop

echo.
echo Done. In GitHub Desktop:
echo   - Add this folder: %GIT_ROOT%
echo   - Branch: develop
echo   - Click Fetch origin
echo.
pause
