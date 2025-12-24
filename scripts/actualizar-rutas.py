#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Script para actualizar rutas en archivos HTML después de reorganización"""

import os
import re
from pathlib import Path

# Ruta base del proyecto
base_path = Path(r'c:\Users\samue\OneDrive\Documentos\Proyecto ERP plataforma')
pages_path = base_path / 'pages'

# Patrones de reemplazo
replacements = [
    # Rutas de imágenes
    (r'href="assets/images/', r'href="../assets/img/'),
    (r'src="assets/images/', r'src="../assets/img/'),
    
    # Rutas de scripts y estilos en assets
    (r'src="assets/scripts/', r'src="../assets/scripts/'),
    (r'href="assets/styles/', r'href="../assets/styles/'),
    
    # Rutas de estilos compilados
    (r'href="styles/', r'href="../styles/'),
]

print("Actualizando rutas en archivos HTML...")
print("=" * 50)

# Procesar todos los archivos HTML en pages/
html_files = list(pages_path.glob('*.html'))
total_updated = 0

for html_file in html_files:
    try:
        # Leer el contenido del archivo
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Aplicar todos los reemplazos
        for pattern, replacement in replacements:
            content = re.sub(pattern, replacement, content)
        
        # Solo escribir si hubo cambios
        if content != original_content:
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ Actualizado: {html_file.name}")
            total_updated += 1
        else:
            print(f"○ Sin cambios: {html_file.name}")
    except Exception as e:
        print(f"✗ Error en {html_file.name}: {e}")

print("=" * 50)
print(f"Total de archivos actualizados: {total_updated}/{len(html_files)}")
print("¡Actualización completada!")
