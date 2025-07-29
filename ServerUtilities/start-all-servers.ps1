# MindGarden - Start All Servers
# This script starts the backend, frontend, and mobile development servers

Write-Host "🚀 Starting MindGarden Development Environment..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Function to check if a directory exists and has package.json
function Test-ProjectDirectory {
    param([string]$Path, [string]$Name)
    
    if (-not (Test-Path $Path)) {
        Write-Host "❌ Error: $Name directory not found at $Path" -ForegroundColor Red
        return $false
    }
    
    if (-not (Test-Path "$Path/package.json")) {
        Write-Host "❌ Error: package.json not found in $Name directory" -ForegroundColor Red
        return $false
    }
    
    return $true
}

# Check if all project directories exist
$backendPath = "backend"
$frontendPath = "frontend"
$mobilePath = "mobile"

if (-not (Test-ProjectDirectory $backendPath "Backend")) { exit 1 }
if (-not (Test-ProjectDirectory $frontendPath "Frontend")) { exit 1 }
if (-not (Test-ProjectDirectory $mobilePath "Mobile")) { exit 1 }

Write-Host "✅ All project directories found" -ForegroundColor Green

# Function to start a server in a new window
function Start-ServerInNewWindow {
    param(
        [string]$Title,
        [string]$WorkingDirectory,
        [string]$Command
    )
    
    Write-Host "Starting $Title..." -ForegroundColor Yellow
    
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = "powershell.exe"
    $startInfo.Arguments = "-NoExit", "-Command", "cd '$WorkingDirectory'; Write-Host 'Starting $Title...' -ForegroundColor Cyan; $Command"
    $startInfo.WorkingDirectory = $WorkingDirectory
    
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $startInfo
    $process.Start() | Out-Null
    
    Write-Host "✅ $Title started in new window" -ForegroundColor Green
    Start-Sleep -Seconds 2
}

# Start Backend Server
Write-Host "`n🔧 Starting Backend Server..." -ForegroundColor Cyan
Start-ServerInNewWindow "Backend Server" $backendPath "npm run dev"

# Start Frontend Server
Write-Host "`n🌐 Starting Frontend Server..." -ForegroundColor Cyan
Start-ServerInNewWindow "Frontend Server" $frontendPath "npm run dev"

# Start Mobile Metro Server
Write-Host "`n📱 Starting Mobile Metro Server..." -ForegroundColor Cyan
Start-ServerInNewWindow "Mobile Metro Server" $mobilePath "npm start"

Write-Host "`n🎉 All servers are starting up!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "Backend:    http://localhost:3000 (typically)" -ForegroundColor White
Write-Host "Frontend:   http://localhost:5173 (Vite default)" -ForegroundColor White
Write-Host "Mobile:     Metro bundler running on port 8081" -ForegroundColor White
Write-Host "`n💡 Tip: Check the individual windows for specific URLs and any startup messages" -ForegroundColor Yellow
Write-Host "💡 Tip: Use 'r' in the mobile Metro window to reload the app" -ForegroundColor Yellow 