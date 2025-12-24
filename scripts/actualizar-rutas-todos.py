#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Script para actualizar todas las rutas en archivos HTML después de reorganización"""

import os
import re
from pathlib import Path

# Ruta base del proyecto
base_path = Path(r'c:\Users\samue\OneDrive\Documentos\Proyecto ERP plataforma')
pages_path = base_path / 'pages'

print("Actualizando rutas en archivos HTML de pages/...")
print("=" * 60)

# Procesar todos los archivos HTML en pages/
html_files = list(pages_path.glob('*.html'))
total_updated = 0
total_changes = 0

for html_file in html_files:
    try:
        # Leer el contenido del archivo
        with open(html_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        original_content = content
        changes = 0
        
        # Reemplazos específicos
        replacements = [
            # Rutas de imágenes
            (r'href="assets/images/', r'href="../assets/img/'),
            (r'src="assets/images/', r'src="../assets/img/'),
            (r"href='assets/images/", r"href='../assets/img/"),
            (r"src='assets/images/", r"src='../assets/img/"),
            
            # Rutas de scripts en assets
            (r'src="assets/scripts/', r'src="../assets/scripts/'),
            (r"src='assets/scripts/", r"src='../assets/scripts/"),
            (r'href="assets/scripts/', r'href="../assets/scripts/'),
            
            # Rutas de estilos en assets
            (r'href="assets/styles/', r'href="../assets/styles/'),
            (r"href='assets/styles/", r"href='../assets/styles/"),
            
            # Rutas de estilos compilados (en styles/)
            (r'href="styles/', r'href="../styles/'),
            (r"href='styles/", r"href='../styles/'),
        ]
        
        # Aplicar todos los reemplazos
        for pattern, replacement in replacements:
            new_content, count = re.subn(pattern, replacement, content)
            if count > 0:
                content = new_content
                changes += count
        
        # Solo escribir si hubo cambios
        if content != original_content:
            with open(html_file, 'w', encoding='utf-8', errors='ignore') as f:
                f.write(content)
            print(f"✓ {html_file.name:30} - {changes:3} cambios")
            total_updated += 1
            total_changes += changes
        else:
            print(f"○ {html_file.name:30} - Sin cambios")
    except Exception as e:
        print(f"✗ {html_file.name:30} - ERROR: {e}")

print("=" * 60)
print(f"Total: {total_updated}/{len(html_files)} archivos actualizados")
print(f"Total de cambios: {total_changes}")
print("¡Actualización completada!")
