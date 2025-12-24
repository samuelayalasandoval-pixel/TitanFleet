# Script para actualizar todas las rutas en archivos HTML

$pagesPath = Join-Path $PSScriptRoot "..\pages"
$htmlFiles = Get-ChildItem -Path $pagesPath -Filter "*.html"

Write-Host "Actualizando rutas en archivos HTML..." -ForegroundColor Cyan

foreach ($file in $htmlFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    
    # Reemplazos
    $content = $content -replace 'href="assets/images/', 'href="../assets/img/'
    $content = $content -replace 'src="assets/images/', 'src="../assets/img/'
    $content = $content -replace "href='assets/images/", "href='../assets/img/"
    $content = $content -replace "src='assets/images/", "src='../assets/img/"
    $content = $content -replace 'src="assets/scripts/', 'src="../assets/scripts/'
    $content = $content -replace "src='assets/scripts/", "src='../assets/scripts/"
    $content = $content -replace 'href="assets/scripts/', 'href="../assets/scripts/'
    $content = $content -replace 'href="assets/styles/', 'href="../assets/styles/"
    $content = $content -replace 'href="styles/', 'href="../styles/'
    $content = $content -replace "href='styles/", "href='../styles/"
    
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
    Write-Host "Actualizado: $($file.Name)" -ForegroundColor Green
}

Write-Host "Completado!" -ForegroundColor Green
