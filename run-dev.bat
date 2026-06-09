@echo off
title EAC Solutions Launcher
echo ===================================================
echo   EAC Solutions Platform Launcher
echo ===================================================
echo.
echo   Starting Backend (Mock Server) on http://localhost:5000
echo   Starting Frontend (Vite) on http://localhost:5173
echo.
echo   -------------------------------------------------
echo   DEMO CREDENTIALS:
echo   - Admin Portal:      admin@eac.local
echo   - Accountant Portal: accountant@eac.local
echo   - Client Portal:     client@eac.local
echo   - Password:          (any password)
echo   -------------------------------------------------
echo.

:: Start the backend mock server in a separate window
start "EAC Backend Server" cmd.exe /c "npm run dev:backend"

:: Start the frontend dev server in a separate window
start "EAC Frontend Server" cmd.exe /c "npm run dev:frontend"

echo.
echo   Both servers started. Open http://localhost:5173 in your browser.
echo   Press any key to exit this launcher (servers will keep running).
pause > nul
