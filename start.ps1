Write-Host "Iniciando Despensa Quique en local..." -ForegroundColor Cyan

if (Get-Command npx -ErrorAction SilentlyContinue) {
    Start-Process "http://localhost:3000"
    npx --yes serve -l 3000 .
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    Start-Process "http://localhost:8000"
    python -m http.server 8000
} else {
    Write-Error "No se encontro Node.js/npx ni Python en el sistema."
}
