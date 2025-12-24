# Script para ejecutar deploy con salida visible
$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 INICIANDO DEPLOY - Sistema ERP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio del proyecto
Set-Location "c:\Users\samue\OneDrive\Documentos\Proyecto ERP plataforma"

# Paso 1: Instalar dependencias si es necesario
Write-Host "[1/4] Verificando dependencias..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "✅ Dependencias ya instaladas" -ForegroundColor Green
}
Write-Host ""

# Paso 2: Compilar estilos
Write-Host "[2/4] Compilando estilos SCSS..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error compilando estilos" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Estilos compilados" -ForegroundColor Green
Write-Host ""

# Paso 3: Verificar Firebase
Write-Host "[3/4] Verificando Firebase..." -ForegroundColor Yellow
firebase use
Write-Host ""

# Paso 4: Deploy
Write-Host "[4/4] Desplegando a Firebase..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

firebase deploy --only hosting,firestore:rules

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ DEPLOY COMPLETADO EXITOSAMENTE" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Tu aplicación está disponible en:" -ForegroundColor Cyan
    Write-Host "   https://titanfleet-60931.web.app" -ForegroundColor White
} else {
    Write-Host "❌ ERROR EN EL DEPLOY" -ForegroundColor Red
    Write-Host "Revisa los mensajes anteriores para más detalles" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan

