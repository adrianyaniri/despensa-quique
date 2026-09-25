Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Levantando Despensa Quique (Vite)   " -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

Start-Process "http://localhost:5173"
npm run dev
