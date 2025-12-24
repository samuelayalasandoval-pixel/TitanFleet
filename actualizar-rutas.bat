@echo off
echo ========================================
echo Actualizando rutas en archivos HTML
echo ========================================
echo.
powershell -ExecutionPolicy Bypass -File "scripts\actualizar-todas-rutas.ps1"
pause
