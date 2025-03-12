# MesAIc Application Starter
Write-Host "Starting MesAIc Application..." -ForegroundColor Cyan

# Kill any existing Node.js processes (optional)
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "Killed existing Node.js processes" -ForegroundColor Yellow
} catch {
    Write-Host "No existing Node.js processes found" -ForegroundColor Gray
}

# Get the current directory
$currentDir = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition

# Start the Python server in a new window
$pythonServerProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c python python/server.py" -WorkingDirectory $currentDir -PassThru -WindowStyle Normal
Write-Host "Started Python server (PID: $($pythonServerProcess.Id))" -ForegroundColor Green

# Wait a moment to ensure Python server is up
Write-Host "Waiting for Python server to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 2

# Start the Node.js collaboration server in a new window
$collaborationServerProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c node server/index.js" -WorkingDirectory $currentDir -PassThru -WindowStyle Normal
Write-Host "Started Collaboration server (PID: $($collaborationServerProcess.Id))" -ForegroundColor Green

# Wait a moment to ensure Collaboration server is up
Write-Host "Waiting for Collaboration server to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 2

# Start the Next.js development server
$nextServerProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory $currentDir -PassThru -WindowStyle Normal
Write-Host "Started Next.js server (PID: $($nextServerProcess.Id))" -ForegroundColor Green

Write-Host "`nMesAIc application is now running!" -ForegroundColor Cyan
Write-Host "Python server: http://localhost:5000" -ForegroundColor Magenta
Write-Host "Collaboration server: http://localhost:3001" -ForegroundColor Magenta
Write-Host "Next.js server: http://localhost:3000" -ForegroundColor Magenta

# Keep this window open with a message
Write-Host "`nPress Ctrl+C to shut down all servers..." -ForegroundColor Yellow

try {
    # Keep the script running until Ctrl+C is pressed
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    # Clean up when Ctrl+C is pressed
    Write-Host "`nShutting down servers..." -ForegroundColor Yellow
    
    # Stop the processes we started
    if ($pythonServerProcess -ne $null -and -not $pythonServerProcess.HasExited) {
        Stop-Process -Id $pythonServerProcess.Id -Force
    }
    
    if ($collaborationServerProcess -ne $null -and -not $collaborationServerProcess.HasExited) {
        Stop-Process -Id $collaborationServerProcess.Id -Force
    }
    
    if ($nextServerProcess -ne $null -and -not $nextServerProcess.HasExited) {
        Stop-Process -Id $nextServerProcess.Id -Force
    }
    
    # Kill any remaining Node.js processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    
    Write-Host "All servers have been shut down." -ForegroundColor Green
} 