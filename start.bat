@echo off
echo =======================================
echo   Levantando Despensa Quique en local
echo =======================================

where npx >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Iniciando con npx serve en http://localhost:3000 ...
    start http://localhost:3000
    npx --yes serve -l 3000 .
    goto :eof
)

where python >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Iniciando con Python en http://localhost:8000 ...
    start http://localhost:8000
    python -m http.server 8000
    goto :eof
)

echo [ERROR] No se encontro Node/npx ni Python en el sistema.
pause
