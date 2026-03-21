@echo off
echo ====================================================
echo Bloom Quran Application
echo ====================================================
echo Installing necessary modules (this may take a minute or two on first run)...
call npm install
echo.
echo Starting the application...
echo Please wait for the browser link to appear (usually http://localhost:3000)
call npm run dev
pause
