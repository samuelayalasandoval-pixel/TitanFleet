# 📝 Instrucciones para Actualizar Rutas Restantes

## Estado Actual

La reorganización está **95% completada**. Los archivos ya están organizados en carpetas, pero algunos archivos HTML en `pages/` aún necesitan que se actualicen sus rutas.

## Archivos que Necesitan Actualización

Los siguientes archivos en `pages/` aún tienen rutas antiguas que necesitan ser actualizadas:

1. diesel.html
2. tesoreria.html
3. mantenimiento.html
4. operadores.html
5. trafico.html
6. facturacion.html
7. demo.html
8. tests.html
9. dashboard-integrado.html
10. sincronizacion.html
11. admin-licencias.html

## Reemplazos Necesarios

En cada archivo HTML, busca y reemplaza:

### 1. Rutas de imágenes:
- `href="assets/images/` → `href="../assets/img/`
- `src="assets/images/` → `src="../assets/img/`
- `href='assets/images/` → `href='../assets/img/`
- `src='assets/images/` → `src='../assets/img/`

### 2. Rutas de estilos:
- `href="styles/` → `href="../styles/`
- `href='styles/` → `href='../styles/`

### 3. Rutas de scripts:
- `src="assets/scripts/` → `src="../assets/scripts/`
- `src='assets/scripts/` → `src='../assets/scripts/`
- `href="assets/scripts/` → `href="../assets/scripts/`

## Solución Automática

Ejecuta este comando en PowerShell desde la raíz del proyecto:

```powershell
cd "c:\Users\samue\OneDrive\Documentos\Proyecto ERP plataforma"
$files = Get-ChildItem -Path "pages" -Filter "*.html"
foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $content = $content -replace 'href="assets/images/', 'href="../assets/img/'
    $content = $content -replace 'src="assets/images/', 'src="../assets/img/'
    $content = $content -replace "href='assets/images/", "href='../assets/img/"
    $content = $content -replace "src='assets/images/", "src='../assets/img/"
    $content = $content -replace 'href="styles/', 'href="../styles/'
    $content = $content -replace "href='styles/", "href='../styles/"
    $content = $content -replace 'src="assets/scripts/', 'src="../assets/scripts/'
    $content = $content -replace "src='assets/scripts/", "src='../assets/scripts/"
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
    Write-Host "Actualizado: $($file.Name)"
}
Write-Host "¡Completado!"
```

## Solución Manual

Si prefieres hacerlo manualmente:

1. Abre cada archivo HTML en `pages/`
2. Usa "Buscar y Reemplazar" (Ctrl+H) en tu editor
3. Aplica los reemplazos mencionados arriba
4. Guarda el archivo

## Archivos Ya Actualizados ✅

- ✅ reportes.html
- ✅ configuracion.html
- ✅ inventario.html
- ✅ CXC.html
- ✅ CXP.html
- ✅ logistica.html
- ✅ menu.html
- ✅ index.html

## Verificación

Después de actualizar, verifica que:
- Las imágenes se carguen correctamente
- Los estilos CSS se apliquen
- Los scripts JavaScript funcionen
- La navegación entre páginas funcione

## Nota

Las referencias entre archivos HTML en `pages/` (como `href="configuracion.html"`) están correctas y no necesitan cambios, ya que están en el mismo directorio.
