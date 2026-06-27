@echo off
REM Fix Next.js webpack errors after git pull (e.g. "a[d] is not a function")
cd /d "%~dp0.."
echo Cleaning .next build cache...
if exist .next rmdir /s /q .next
echo Killing port 4350...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4350" ^| findstr "LISTENING"') do taskkill /PID %%a /F 2>nul
echo.
echo Starting dev server...
call npm run dev
