# Script de Deploy para Firebase Hosting
# Sistema ERP TitanFleet

Write-Host "🚀 Iniciando proceso de deploy..." -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "📦 Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js no está instalado. Por favor instálalo desde https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js $nodeVersion encontrado" -ForegroundColor Green

# Verificar npm
Write-Host "📦 Verificando npm..." -ForegroundColor Yellow
$npmVersion = npm --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm no está instalado." -ForegroundColor Red
    exit 1
}
Write-Host "✅ npm $npmVersion encontrado" -ForegroundColor Green

# Verificar Firebase CLI
Write-Host "📦 Verificando Firebase CLI..." -ForegroundColor Yellow
$firebaseInstalled = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseInstalled) {
    Write-Host "⚠️ Firebase CLI no está instalado. Instalando..." -ForegroundColor Yellow
    npm install -g firebase-tools
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando Firebase CLI. Intenta manualmente: npm install -g firebase-tools" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Firebase CLI instalado" -ForegroundColor Green
} else {
    Write-Host "✅ Firebase CLI encontrado" -ForegroundColor Green
}

# Verificar dependencias
Write-Host ""
Write-Host "📦 Verificando dependencias del proyecto..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️ node_modules no encontrado. Instalando dependencias..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencias encontradas" -ForegroundColor Green
}

# Verificar autenticación de Firebase
Write-Host ""
Write-Host "🔐 Verificando autenticación de Firebase..." -ForegroundColor Yellow
$firebaseUser = firebase login:list 2>&1
if ($LASTEXITCODE -ne 0 -or $firebaseUser -match "No authorized accounts") {
    Write-Host "⚠️ No estás autenticado en Firebase. Iniciando login..." -ForegroundColor Yellow
    firebase login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error en la autenticación de Firebase" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Autenticación exitosa" -ForegroundColor Green
} else {
    Write-Host "✅ Ya estás autenticado en Firebase" -ForegroundColor Green
}

# Compilar estilos
Write-Host ""
Write-Host "🎨 Compilando estilos SCSS..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error compilando estilos" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Estilos compilados" -ForegroundColor Green

# Verificar archivos necesarios
Write-Host ""
Write-Host "📋 Verificando archivos necesarios..." -ForegroundColor Yellow
$requiredFiles = @("index.html", "firebase.json", ".firebaserc", "firestore.rules")
$allPresent = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file encontrado" -ForegroundColor Green
    } else {
        Write-Host "❌ $file no encontrado" -ForegroundColor Red
        $allPresent = $false
    }
}

if (-not $allPresent) {
    Write-Host ""
    Write-Host "❌ Faltan archivos necesarios para el deploy" -ForegroundColor Red
    exit 1
}

# Preguntar qué desplegar
Write-Host ""
Write-Host "¿Qué deseas desplegar?" -ForegroundColor Cyan
Write-Host "1. Todo (Hosting + Firestore Rules)" -ForegroundColor White
Write-Host "2. Solo Hosting" -ForegroundColor White
Write-Host "3. Solo Firestore Rules" -ForegroundColor White
Write-Host "4. Cancelar" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Selecciona una opción (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🚀 Desplegando todo..." -ForegroundColor Cyan
        npm run deploy:all
    }
    "2" {
        Write-Host ""
        Write-Host "🚀 Desplegando solo Hosting..." -ForegroundColor Cyan
        npm run deploy:hosting
    }
    "3" {
        Write-Host ""
        Write-Host "🚀 Desplegando solo Firestore Rules..." -ForegroundColor Cyan
        npm run deploy:firestore
    }
    "4" {
        Write-Host "❌ Deploy cancelado" -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "❌ Opción inválida" -ForegroundColor Red
        exit 1
    }
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ ¡Deploy completado exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Tu aplicación está disponible en:" -ForegroundColor Cyan
    Write-Host "   https://titanfleet-60931.web.app" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Error durante el deploy. Revisa los mensajes anteriores." -ForegroundColor Red
    exit 1
}

