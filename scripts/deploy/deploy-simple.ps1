# Script de Deploy Simplificado
# Sistema ERP TitanFleet

Write-Host "🚀 Iniciando deploy..." -ForegroundColor Cyan
Write-Host ""

# Paso 1: Compilar estilos
Write-Host "📦 Paso 1: Compilando estilos SCSS..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error compilando estilos" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Estilos compilados" -ForegroundColor Green
Write-Host ""

# Paso 2: Verificar autenticación
Write-Host "🔐 Paso 2: Verificando autenticación Firebase..." -ForegroundColor Yellow
$firebaseUser = firebase login:list 2>&1
if ($LASTEXITCODE -ne 0 -or $firebaseUser -match "No authorized accounts") {
    Write-Host "⚠️ Necesitas autenticarte en Firebase" -ForegroundColor Yellow
    Write-Host "Ejecutando: firebase login" -ForegroundColor Cyan
    firebase login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error en la autenticación" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Autenticación verificada" -ForegroundColor Green
Write-Host ""

# Paso 3: Deploy
Write-Host "🚀 Paso 3: Desplegando a Firebase Hosting..." -ForegroundColor Yellow
Write-Host ""
firebase deploy --only hosting

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ ¡Deploy completado exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Tu aplicación está disponible en:" -ForegroundColor Cyan
    Write-Host "   https://titanfleet-60931.web.app" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Error durante el deploy" -ForegroundColor Red
    exit 1
}

