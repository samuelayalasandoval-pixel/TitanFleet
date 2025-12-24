# Script de reorganización de archivos del proyecto ERP

# Obtener la ruta base del proyecto (directorio padre del script)
if ($PSScriptRoot) {
    $rootPath = Split-Path -Parent $PSScriptRoot
} else {
    # Si se ejecuta directamente, usar el directorio actual
    $rootPath = $PWD.Path
}

Write-Host "Iniciando reorganización desde: $rootPath" -ForegroundColor Cyan

# Crear carpetas necesarias
$folders = @("pages", "scripts\deploy", "docs\archive")
foreach ($folder in $folders) {
    $fullPath = Join-Path $rootPath $folder
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        Write-Host "✓ Creada carpeta: $folder" -ForegroundColor Green
    } else {
        Write-Host "✓ Carpeta ya existe: $folder" -ForegroundColor Yellow
    }
}

# Mover archivos HTML (excepto index.html)
Write-Host "`nMoviendo archivos HTML..." -ForegroundColor Cyan
$htmlFiles = Get-ChildItem -Path $rootPath -Filter "*.html" -File | Where-Object { $_.Name -ne "index.html" }
foreach ($file in $htmlFiles) {
    $dest = Join-Path $rootPath "pages" $file.Name
    Move-Item -Path $file.FullName -Destination $dest -Force
    Write-Host "  ✓ Movido: $($file.Name) -> pages\$($file.Name)" -ForegroundColor Green
}

# Mover scripts PowerShell (excepto este script y reorganizar.py)
Write-Host "`nMoviendo scripts PowerShell..." -ForegroundColor Cyan
$psFiles = Get-ChildItem -Path $rootPath -Filter "*.ps1" -File | Where-Object { $_.FullName -ne $PSCommandPath }
foreach ($file in $psFiles) {
    $dest = Join-Path $rootPath "scripts\deploy" $file.Name
    Move-Item -Path $file.FullName -Destination $dest -Force
    Write-Host "  ✓ Movido: $($file.Name) -> scripts\deploy\$($file.Name)" -ForegroundColor Green
}

# Mover archivos de documentación de refactorización a docs/archive
Write-Host "`nMoviendo documentación temporal..." -ForegroundColor Cyan
$refactoringFiles = Get-ChildItem -Path $rootPath -Filter "REFACTORIZACION_*.md" -File -ErrorAction SilentlyContinue
if ($refactoringFiles) {
    foreach ($file in $refactoringFiles) {
        $dest = Join-Path $rootPath "docs\archive" $file.Name
        Move-Item -Path $file.FullName -Destination $dest -Force
        Write-Host "  ✓ Movido: $($file.Name) -> docs\archive\$($file.Name)" -ForegroundColor Green
    }
}

$lineasFiles = Get-ChildItem -Path $rootPath -Filter "LINEAS_EXACTAS_*.md" -File -ErrorAction SilentlyContinue
if ($lineasFiles) {
    foreach ($file in $lineasFiles) {
        $dest = Join-Path $rootPath "docs\archive" $file.Name
        Move-Item -Path $file.FullName -Destination $dest -Force
        Write-Host "  ✓ Movido: $($file.Name) -> docs\archive\$($file.Name)" -ForegroundColor Green
    }
}

$listaPath = Join-Path $rootPath "LISTA_LINEAS_ELIMINAR.txt"
if (Test-Path $listaPath) {
    Move-Item -Path $listaPath -Destination (Join-Path $rootPath "docs\archive") -Force
    Write-Host "  ✓ Movido: LISTA_LINEAS_ELIMINAR.txt -> docs\archive\" -ForegroundColor Green
}

$erroresPath = Join-Path $rootPath "ERRORES_Y_PRUEBAS.md"
if (Test-Path $erroresPath) {
    Move-Item -Path $erroresPath -Destination (Join-Path $rootPath "docs\archive") -Force
    Write-Host "  ✓ Movido: ERRORES_Y_PRUEBAS.md -> docs\archive\" -ForegroundColor Green
}

$migrationPath = Join-Path $rootPath "ERP_STATE_MIGRATION.md"
if (Test-Path $migrationPath) {
    Move-Item -Path $migrationPath -Destination (Join-Path $rootPath "docs\archive") -Force
    Write-Host "  ✓ Movido: ERP_STATE_MIGRATION.md -> docs\archive\" -ForegroundColor Green
}

# Consolidar carpetas de imágenes
Write-Host "`nConsolidando imágenes..." -ForegroundColor Cyan
$imagesPath = Join-Path $rootPath "assets\images"
$imgPath = Join-Path $rootPath "assets\img"
if (Test-Path $imagesPath) {
    $images = Get-ChildItem -Path $imagesPath -File -ErrorAction SilentlyContinue
    if ($images) {
        foreach ($image in $images) {
            $dest = Join-Path $imgPath $image.Name
            if (-not (Test-Path $dest)) {
                Move-Item -Path $image.FullName -Destination $dest -Force
                Write-Host "  ✓ Movida imagen: $($image.Name) -> assets\img\" -ForegroundColor Green
            } else {
                Write-Host "  ⚠ Imagen ya existe (omitida): $($image.Name)" -ForegroundColor Yellow
            }
        }
    }
    # Intentar eliminar la carpeta si está vacía
    $remaining = Get-ChildItem -Path $imagesPath -ErrorAction SilentlyContinue
    if (-not $remaining) {
        Remove-Item -Path $imagesPath -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Eliminada carpeta: assets\images" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Carpeta assets\images no está vacía, no se eliminó" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✓ No existe carpeta assets\images para consolidar" -ForegroundColor Yellow
}

# Mover archivos de refactorización desde docs/ a docs/archive/
Write-Host "`nMoviendo refactorización desde docs/..." -ForegroundColor Cyan
$docsPath = Join-Path $rootPath "docs"
if (Test-Path $docsPath) {
    $docsRefactoring = Get-ChildItem -Path $docsPath -Filter "REFACTORIZACION_*.md" -File -ErrorAction SilentlyContinue
    if ($docsRefactoring) {
        foreach ($file in $docsRefactoring) {
            $dest = Join-Path $rootPath "docs\archive" $file.Name
            Move-Item -Path $file.FullName -Destination $dest -Force
            Write-Host "  ✓ Movido desde docs: $($file.Name) -> docs\archive\$($file.Name)" -ForegroundColor Green
        }
    } else {
        Write-Host "  ✓ No hay archivos de refactorización en docs/" -ForegroundColor Yellow
    }
}

Write-Host "`n" -NoNewline
Write-Host "✓ Reorganización completada!" -ForegroundColor Green -BackgroundColor Black
Write-Host ""
