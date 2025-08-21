# Start backend in production mode
$env:NODE_ENV = 'production'
Write-Host "Starting backend (production)..." -ForegroundColor Cyan
npm start --prefix ../backend
