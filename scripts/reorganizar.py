#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Script para reorganizar archivos del proyecto ERP"""

import os
import shutil
from pathlib import Path

# Ruta base del proyecto
base_path = Path(r'c:\Users\samue\OneDrive\Documentos\Proyecto ERP plataforma')

# Crear carpetas necesarias
folders = ['pages', 'scripts/deploy', 'docs/archive']
for folder in folders:
    folder_path = base_path / folder
    folder_path.mkdir(parents=True, exist_ok=True)
    print(f"✓ Carpeta creada/verificada: {folder}")

# Mover archivos HTML (excepto index.html)
html_files_to_move = [
    'reportes.html', 'configuracion.html', 'inventario.html', 'CXP.html',
    'CXC.html', 'diesel.html', 'facturacion.html', 'logistica.html',
    'mantenimiento.html', 'operadores.html', 'trafico.html', 'tesoreria.html',
    'menu.html', 'demo.html', 'tests.html', 'dashboard-integrado.html',
    'sincronizacion.html', 'admin-licencias.html'
]

for html_file in html_files_to_move:
    src = base_path / html_file
    dst = base_path / 'pages' / html_file
    if src.exists():
        shutil.move(str(src), str(dst))
        print(f"✓ Movido: {html_file} -> pages/{html_file}")
    else:
        print(f"⚠ No encontrado: {html_file}")

# Mover scripts PowerShell
ps_files_to_move = [
    'deploy.ps1', 'deploy-simple.ps1', 'ejecutar-deploy.ps1', 'verificar-deploy.ps1'
]

for ps_file in ps_files_to_move:
    src = base_path / ps_file
    dst = base_path / 'scripts' / 'deploy' / ps_file
    if src.exists():
        shutil.move(str(src), str(dst))
        print(f"✓ Movido: {ps_file} -> scripts/deploy/{ps_file}")
    else:
        print(f"⚠ No encontrado: {ps_file}")

# Mover archivos de documentación de refactorización
import glob

refactoring_patterns = [
    'REFACTORIZACION_*.md',
    'LINEAS_EXACTAS_*.md',
    'LISTA_LINEAS_ELIMINAR.txt',
    'ERRORES_Y_PRUEBAS.md',
    'ERP_STATE_MIGRATION.md'
]

for pattern in refactoring_patterns:
    for file_path in base_path.glob(pattern):
        if file_path.is_file():
            dst = base_path / 'docs' / 'archive' / file_path.name
            shutil.move(str(file_path), str(dst))
            print(f"✓ Movido: {file_path.name} -> docs/archive/{file_path.name}")

# Mover desde docs/ también
docs_path = base_path / 'docs'
if docs_path.exists():
    for file_path in docs_path.glob('REFACTORIZACION_*.md'):
        if file_path.is_file():
            dst = base_path / 'docs' / 'archive' / file_path.name
            shutil.move(str(file_path), str(dst))
            print(f"✓ Movido desde docs: {file_path.name} -> docs/archive/{file_path.name}")

# Consolidar carpetas de imágenes
images_path = base_path / 'assets' / 'images'
img_path = base_path / 'assets' / 'img'

if images_path.exists():
    for image_file in images_path.iterdir():
        if image_file.is_file():
            dst = img_path / image_file.name
            if not dst.exists():
                shutil.move(str(image_file), str(dst))
                print(f"✓ Movida imagen: {image_file.name} -> assets/img/")
    
    # Intentar eliminar la carpeta si está vacía
    try:
        images_path.rmdir()
        print(f"✓ Eliminada carpeta: assets/images")
    except OSError:
        print(f"⚠ No se pudo eliminar assets/images (puede no estar vacía)")

print("\n✓ Reorganización completada!")
