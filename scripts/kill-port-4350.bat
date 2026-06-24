@echo off
REM Kill whatever is using port 4350 (Windows)
echo Freeing port 4350...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4350" ^| findstr "LISTENING"') do (
  echo Killing PID %%a
  taskkill /PID %%a /F
)
timeout /t 2 /nobreak >nul
netstat -ano | findstr ":4350" | findstr "LISTENING" >nul
if %errorlevel%==0 (echo Port still in use) else (echo Port 4350 is free.)
pause
