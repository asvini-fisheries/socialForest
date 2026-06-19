@echo off
REM SocialForest dev server — run from project root (where package.json lives)
cd /d "%~dp0.."
echo Starting SocialForest at http://localhost:4350
call npm install
call npm run dev
