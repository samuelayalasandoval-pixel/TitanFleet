# Script para verificar y ejecutar deploy
$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 DEPLOY - Sistema ERP TitanFleet" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "c:\Users\samue\OneDrive\Documentos\Proyecto ERP plataforma"

# Paso 1: Compilar
Write-Host "[1/2] Compilando estilos..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en compilación" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Compilación completada" -ForegroundColor Green
Write-Host ""

# Paso 2: Deploy
Write-Host "[2/2] Desplegando a Firebase Hosting..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

firebase deploy --only hosting

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ DEPLOY COMPLETADO" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Aplicación disponible en:" -ForegroundColor Cyan
    Write-Host "   https://titanfleet-60931.web.app" -ForegroundColor White
    Write-Host "   https://titanfleet-60931.firebaseapp.com" -ForegroundColor White
} else {
    Write-Host "❌ ERROR EN DEPLOY" -ForegroundColor Red
    Write-Host "Revisa los mensajes anteriores" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan

