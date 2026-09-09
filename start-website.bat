@echo off
REM ============================================
REM  RapidGo Website - Windows one-click starter
REM  Double-click this file to run the site.
REM  Then open: http://localhost:8080
REM ============================================
cd /d "%~dp0"
echo.
echo  ========================================
echo   RapidGo is starting...
echo   Open in browser:  http://localhost:8080
echo   Press CTRL+C to stop the server
echo  ========================================
echo.
python -m http.server 8080 --bind 0.0.0.0
pause
