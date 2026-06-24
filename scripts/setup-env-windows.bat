@echo off
REM Create .env.local for SocialForest (Windows)
cd /d "%~dp0.."

set ENV_FILE=%CD%\.env.local

if exist "%ENV_FILE%" (
  echo .env.local already exists:
  echo   %ENV_FILE%
  echo.
  notepad "%ENV_FILE%"
  exit /b 0
)

if not exist ".env.example" (
  echo ERROR: .env.example not found in %CD%
  pause
  exit /b 1
)

copy ".env.example" ".env.local" >nul
echo Created: %ENV_FILE%
echo.
echo Add your Supabase keys from Dashboard - Project Settings - API
echo   NEXT_PUBLIC_SUPABASE_URL
echo   NEXT_PUBLIC_SUPABASE_ANON_KEY
echo   SUPABASE_SERVICE_ROLE_KEY
echo.
notepad "%ENV_FILE%"
pause
