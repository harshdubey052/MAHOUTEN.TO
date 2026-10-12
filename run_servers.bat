@echo off
title Mahouten.to Server Launcher
echo ========================================================
echo Starting Mahouten.to Streaming Platform Servers...
echo ========================================================

echo [1/2] Starting Django REST Backend on Port 8000...
start "Mahouten Backend (Port 8000)" cmd /k "cd /d d:\python\mahouten.to\backend && .\.venv\Scripts\python.exe manage.py runserver 8000"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Vite Frontend on Port 5173...
start "Mahouten Frontend (Port 5173)" cmd /k "cd /d d:\python\mahouten.to\frontend && npm.cmd run dev"

echo.
echo ========================================================
echo Both servers have been launched!
echo Frontend: http://localhost:5173/
echo Backend:  http://localhost:8000/api/v1/
echo ========================================================
pause

