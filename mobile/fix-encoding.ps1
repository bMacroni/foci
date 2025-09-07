# Fix encoding issues for React Native development
# Run this script before starting Metro or building the app

Write-Host "Setting UTF-8 encoding..." -ForegroundColor Green
chcp 65001

Write-Host "Encoding fixed! You can now run your React Native commands." -ForegroundColor Green
Write-Host "Example: npx react-native start --reset-cache" -ForegroundColor Yellow

