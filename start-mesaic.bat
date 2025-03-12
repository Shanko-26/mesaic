@echo off
echo Starting MesAIc Application...

:: Kill any existing Node.js processes (optional, remove if you don't want this behavior)
taskkill /F /IM node.exe 2>nul
echo Killed existing Node.js processes

:: Start the Python server in a new window
start "MesAIc Python Server" cmd /k "cd /d %~dp0 && python python/server.py"
echo Started Python server

:: Wait a moment to ensure Python server is up
timeout /t 2 /nobreak > nul

:: Start the Node.js collaboration server in a new window
start "MesAIc Collaboration Server" cmd /k "cd /d %~dp0 && node server/index.js"
echo Started Collaboration server

:: Wait a moment to ensure Collaboration server is up
timeout /t 2 /nobreak > nul

:: Start the Next.js development server
start "MesAIc Next.js Server" cmd /k "cd /d %~dp0 && npm run dev"
echo Started Next.js server

echo MesAIc application is now running!
echo Python server: http://localhost:5000
echo Collaboration server: http://localhost:3001
echo Next.js server: http://localhost:3000

:: Keep this window open with a message
echo.
echo Press any key to shut down all servers...
pause > nul

:: Kill servers when user presses a key
taskkill /F /FI "WINDOWTITLE eq MesAIc Python Server*" 2>nul
taskkill /F /FI "WINDOWTITLE eq MesAIc Collaboration Server*" 2>nul
taskkill /F /FI "WINDOWTITLE eq MesAIc Next.js Server*" 2>nul
taskkill /F /IM node.exe 2>nul
echo All servers have been shut down. 