# Actualizar archivos restantes

$files = @(
    "pages\diesel.html",
    "pages\tesoreria.html",
    "pages\mantenimiento.html",
    "pages\operadores.html",
    "pages\trafico.html",
    "pages\facturacion.html",
    "pages\demo.html",
    "pages\tests.html",
    "pages\dashboard-integrado.html",
    "pages\sincronizacion.html",
    "pages\admin-licencias.html"
)

$root = Split-Path -Parent $PSScriptRoot

foreach ($file in $files) {
    $path = Join-Path $root $file
    if (Test-Path $path) {
        $content = Get-Content -Path $path -Raw -Encoding UTF8
        $content = $content -replace 'href="assets/images/', 'href="../assets/img/'
        $content = $content -replace 'src="assets/images/', 'src="../assets/img/'
        $content = $content -replace "href='assets/images/", "href='../assets/img/"
        $content = $content -replace "src='assets/images/", "src='../assets/img/"
        $content = $content -replace 'href="styles/', 'href="../styles/'
        $content = $content -replace "href='styles/", "href='../styles/"
        $content = $content -replace 'src="assets/scripts/', 'src="../assets/scripts/'
        $content = $content -replace "src='assets/scripts/", "src='../assets/scripts/"
        Set-Content -Path $path -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Actualizado: $file"
    }
}

Write-Host "Completado!"
