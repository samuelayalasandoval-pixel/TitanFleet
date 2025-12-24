# Script para actualizar todas las rutas en archivos HTML

Write-Host "Actualizando rutas en archivos HTML..." -ForegroundColor Cyan
Write-Host ""

$rootPath = Split-Path -Parent $PSScriptRoot
$pagesPath = Join-Path $rootPath "pages"
$files = Get-ChildItem -Path $pagesPath -Filter "*.html"

$totalUpdated = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Reemplazos
    $content = $content -replace 'href="assets/images/', 'href="../assets/img/'
    $content = $content -replace 'src="assets/images/', 'src="../assets/img/'
    $content = $content -replace "href='assets/images/", "href='../assets/img/"
    $content = $content -replace "src='assets/images/", "src='../assets/img/"
    $content = $content -replace 'href="styles/', 'href="../styles/'
    $content = $content -replace "href='styles/", "href='../styles/"
    $content = $content -replace 'src="assets/scripts/', 'src="../assets/scripts/'
    $content = $content -replace "src='assets/scripts/", "src='../assets/scripts/"
    $content = $content -replace 'href="assets/scripts/', 'href="../assets/scripts/'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "OK: $($file.Name)" -ForegroundColor Green
        $totalUpdated++
    }
}

Write-Host ""
Write-Host "Completado! Se actualizaron $totalUpdated archivos." -ForegroundColor Green
Write-Host "Presiona cualquier tecla para continuar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
