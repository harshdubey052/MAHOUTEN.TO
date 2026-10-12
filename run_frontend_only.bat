@echo off
echo ========================================================
echo   Mahouten.to - Starting Frontend Only (Vite: 5173)
echo   Low Memory Mode (512MB limit)
echo ========================================================
cd /d "%~dp0\frontend"
set NODE_OPTIONS=--max-old-space-size=512
npm.cmd run dev
pause
