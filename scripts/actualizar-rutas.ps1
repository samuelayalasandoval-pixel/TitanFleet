# Script para actualizar rutas en archivos HTML despues de reorganizacion

$pagesPath = Join-Path $PSScriptRoot "..\pages"
$htmlFiles = Get-ChildItem -Path $pagesPath -Filter "*.html"

Write-Host "Actualizando rutas en archivos HTML de pages/..." -ForegroundColor Cyan
Write-Host ("=" * 60)

$totalUpdated = 0
$totalChanges = 0

foreach ($file in $htmlFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $changes = 0
    
    # Reemplazos
    $newContent = $content -replace 'href="assets/images/', 'href="../assets/img/'
    if ($newContent -ne $content) { $changes++; $content = $newContent }
    
    $newContent = $content -replace 'src="assets/images/', 'src="../assets/img/'
    if ($newContent -ne $content) { $changes++; $content = $newContent }
    
    $newContent = $content -replace "href='assets/images/", "href='../assets/img/"
    if ($newContent -ne $content) { $changes++; $content = $newContent }
    
    $newContent = $content -replace "src='assets/images/", "src='../assets/img/"
    if ($newContent -ne $content) { $changes++; $content = $newContent }
    
    $newContent = $content -replace 'src="assets/scripts/', 'src="../assets/scripts/'
    if ($newContent -ne $content) { $changes++; $content = $newContent }
    
    $newContent = $content -replace "src='assets/scripts/", "src='../assets/scripts/"
    if ($newContent -ne $content) { $changes++; $content = $newContent }
    
    $newContent = $content -replace 'href="assets/scripts/', 'href="../assets/scripts/'
    if ($newContent -ne $content) { $changes++; $content = $newContent }
    
    $newContent = $content -replace 'href="assets/styles/', 'href="../assets/styles/'
    if ($newContent -ne $content) { $changes++; $content = $newContent }
    
    $newContent = $content -replace 'href="styles/', 'href="../styles/'
    if ($newContent -ne $content) { $changes++; $content = $newContent }
    
    $newContent = $content -replace "href='styles/", "href='../styles/"
    if ($newContent -ne $content) { $changes++; $content = $newContent }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host ("OK $($file.Name.PadRight(30)) - $changes cambios") -ForegroundColor Green
        $totalUpdated++
        $totalChanges += $changes
    } else {
        Write-Host ("  $($file.Name.PadRight(30)) - Sin cambios") -ForegroundColor Yellow
    }
}

Write-Host ("=" * 60)
Write-Host "Total: $totalUpdated/$($htmlFiles.Count) archivos actualizados" -ForegroundColor Cyan
Write-Host "Total de cambios: $totalChanges" -ForegroundColor Cyan
Write-Host "Actualizacion completada!" -ForegroundColor Green
