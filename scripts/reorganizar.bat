@echo off
echo ========================================
echo Reorganizando archivos del proyecto ERP
echo ========================================
echo.

cd /d "%~dp0\.."

echo Creando carpetas...
if not exist "pages" mkdir "pages"
if not exist "scripts\deploy" mkdir "scripts\deploy"
if not exist "docs\archive" mkdir "docs\archive"
echo Carpetas creadas.
echo.

echo Moviendo archivos HTML...
move "reportes.html" "pages\" >nul 2>&1 && echo   [OK] reportes.html
move "configuracion.html" "pages\" >nul 2>&1 && echo   [OK] configuracion.html
move "inventario.html" "pages\" >nul 2>&1 && echo   [OK] inventario.html
move "CXC.html" "pages\" >nul 2>&1 && echo   [OK] CXC.html
move "CXP.html" "pages\" >nul 2>&1 && echo   [OK] CXP.html
move "diesel.html" "pages\" >nul 2>&1 && echo   [OK] diesel.html
move "facturacion.html" "pages\" >nul 2>&1 && echo   [OK] facturacion.html
move "logistica.html" "pages\" >nul 2>&1 && echo   [OK] logistica.html
move "mantenimiento.html" "pages\" >nul 2>&1 && echo   [OK] mantenimiento.html
move "operadores.html" "pages\" >nul 2>&1 && echo   [OK] operadores.html
move "trafico.html" "pages\" >nul 2>&1 && echo   [OK] trafico.html
move "tesoreria.html" "pages\" >nul 2>&1 && echo   [OK] tesoreria.html
move "menu.html" "pages\" >nul 2>&1 && echo   [OK] menu.html
move "demo.html" "pages\" >nul 2>&1 && echo   [OK] demo.html
move "tests.html" "pages\" >nul 2>&1 && echo   [OK] tests.html
move "dashboard-integrado.html" "pages\" >nul 2>&1 && echo   [OK] dashboard-integrado.html
move "sincronizacion.html" "pages\" >nul 2>&1 && echo   [OK] sincronizacion.html
move "admin-licencias.html" "pages\" >nul 2>&1 && echo   [OK] admin-licencias.html
echo.

echo Moviendo scripts PowerShell...
move "deploy.ps1" "scripts\deploy\" >nul 2>&1 && echo   [OK] deploy.ps1
move "deploy-simple.ps1" "scripts\deploy\" >nul 2>&1 && echo   [OK] deploy-simple.ps1
move "ejecutar-deploy.ps1" "scripts\deploy\" >nul 2>&1 && echo   [OK] ejecutar-deploy.ps1
move "verificar-deploy.ps1" "scripts\deploy\" >nul 2>&1 && echo   [OK] verificar-deploy.ps1
echo.

echo Moviendo documentacion temporal...
if exist "REFACTORIZACION_*.md" (
    for %%f in (REFACTORIZACION_*.md) do (
        move "%%f" "docs\archive\" >nul 2>&1 && echo   [OK] %%f
    )
)
if exist "LINEAS_EXACTAS_*.md" (
    for %%f in (LINEAS_EXACTAS_*.md) do (
        move "%%f" "docs\archive\" >nul 2>&1 && echo   [OK] %%f
    )
)
if exist "LISTA_LINEAS_ELIMINAR.txt" move "LISTA_LINEAS_ELIMINAR.txt" "docs\archive\" >nul 2>&1 && echo   [OK] LISTA_LINEAS_ELIMINAR.txt
if exist "ERRORES_Y_PRUEBAS.md" move "ERRORES_Y_PRUEBAS.md" "docs\archive\" >nul 2>&1 && echo   [OK] ERRORES_Y_PRUEBAS.md
if exist "ERP_STATE_MIGRATION.md" move "ERP_STATE_MIGRATION.md" "docs\archive\" >nul 2>&1 && echo   [OK] ERP_STATE_MIGRATION.md
echo.

echo Moviendo refactorizacion desde docs...
if exist "docs\REFACTORIZACION_*.md" (
    for %%f in (docs\REFACTORIZACION_*.md) do (
        move "%%f" "docs\archive\" >nul 2>&1 && echo   [OK] docs\%%~nxf
    )
)
echo.

echo Consolidando imagenes...
if exist "assets\images" (
    if exist "assets\images\*" (
        for %%f in (assets\images\*) do (
            if not exist "assets\img\%%~nxf" (
                move "%%f" "assets\img\" >nul 2>&1 && echo   [OK] %%~nxf
            )
        )
    )
    rd "assets\images" >nul 2>&1 && echo   [OK] Carpeta assets\images eliminada
)
echo.

echo ========================================
echo Reorganizacion completada!
echo ========================================
pause
