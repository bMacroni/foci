# Start backend in development mode
$env:NODE_ENV = 'development'
Write-Host "Starting backend (development)..." -ForegroundColor Cyan
npm run dev --prefix ../backend
