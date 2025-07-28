@echo off
echo 🚀 Starting MindGarden Development Environment...
echo ================================================

REM Check if directories exist
if not exist "backend\package.json" (
    echo ❌ Error: Backend package.json not found
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ❌ Error: Frontend package.json not found
    pause
    exit /b 1
)

if not exist "mobile\package.json" (
    echo ❌ Error: Mobile package.json not found
    pause
    exit /b 1
)

echo ✅ All project directories found

REM Start Backend Server
echo.
echo 🔧 Starting Backend Server...
start "backend" powershell -NoExit -Command "cd backend; npm run dev"

REM Start Frontend Server  
echo 🌐 Starting Frontend Server...
start "frontend" powershell -NoExit -Command "cd frontend; npm run dev"

REM Start Mobile Metro Server
echo 📱 Starting Mobile Metro Server...
start "react-native" powershell -NoExit -Command "cd mobile; npm start"

echo.
echo 🎉 All servers are starting up!
echo ================================================
echo Backend:    http://localhost:3000 (typically)
echo Frontend:   http://localhost:5173 (Vite default)
echo Mobile:     Metro bundler running on port 8081
echo.
echo 💡 Tip: Check the individual windows for specific URLs and any startup messages
echo 💡 Tip: Use 'r' in the mobile Metro window to reload the app
pause 