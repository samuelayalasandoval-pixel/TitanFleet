# Estructura del Proyecto ERP - Organización

## 📁 Estructura de Carpetas Recomendada

```
Proyecto ERP plataforma/
├── pages/                          # Páginas HTML (todas excepto index.html)
│   ├── reportes.html
│   ├── configuracion.html
│   ├── inventario.html
│   ├── CXC.html
│   ├── CXP.html
│   ├── diesel.html
│   ├── facturacion.html
│   ├── logistica.html
│   ├── mantenimiento.html
│   ├── operadores.html
│   ├── trafico.html
│   ├── tesoreria.html
│   ├── menu.html
│   ├── demo.html
│   ├── tests.html
│   ├── dashboard-integrado.html
│   ├── sincronizacion.html
│   └── admin-licencias.html
│
├── assets/                         # Recursos estáticos
│   ├── img/                        # Imágenes (consolidado)
│   │   ├── Logo TF.png
│   │   ├── favicon.svg
│   │   ├── Documentos.jpg
│   │   ├── Economia.jpg
│   │   ├── equipo-trabajo.jpg
│   │   ├── hombre-trabajador.jpg
│   │   └── truck.jpg
│   ├── scripts/                    # JavaScript
│   │   ├── auth.js
│   │   ├── main.js
│   │   ├── firebase-init.js
│   │   ├── configuracion.js
│   │   ├── cxc.js
│   │   ├── cxp.js
│   │   ├── inventario.js
│   │   ├── reportes.js
│   │   └── [módulos organizados en subcarpetas]
│   └── styles/                     # Estilos SCSS
│       ├── main.scss
│       ├── base/
│       └── components/
│
├── styles/                         # CSS compilado (generado)
│   ├── main.css
│   ├── configuracion.css
│   ├── cxc.css
│   ├── cxp.css
│   └── [otros CSS compilados]
│
├── scripts/                        # Scripts de desarrollo/deploy
│   ├── deploy/                     # Scripts PowerShell de deploy
│   │   ├── deploy.ps1
│   │   ├── deploy-simple.ps1
│   │   ├── ejecutar-deploy.ps1
│   │   └── verificar-deploy.ps1
│   ├── reorganizar.ps1            # Script de reorganización
│   └── reorganizar.py             # Script de reorganización (Python)
│
├── docs/                           # Documentación
│   ├── README.md                   # Documentación principal
│   ├── DOCUMENTACION_TECNICA.md
│   ├── GUIA_DEPLOY.md
│   ├── GUIA_PRUEBAS_COMPLETA.md
│   └── archive/                    # Documentación antigua/temporal
│       ├── REFACTORIZACION_*.md
│       ├── LINEAS_EXACTAS_*.md
│       ├── ERRORES_Y_PRUEBAS.md
│       └── ERP_STATE_MIGRATION.md
│
├── public/                         # Archivos públicos (si aplica)
│   └── index.html
│
├── index.html                      # Página principal (se queda en raíz)
├── package.json                    # Configuración de npm
├── firebase.json                   # Configuración de Firebase
└── firestore.rules                 # Reglas de Firestore
```

## 📝 Archivos que Deben Moverse

### HTML → pages/
- ✅ reportes.html
- ✅ configuracion.html
- ✅ inventario.html
- ✅ CXC.html, CXP.html
- ✅ diesel.html, facturacion.html, logistica.html
- ✅ mantenimiento.html, operadores.html, trafico.html
- ✅ tesoreria.html, menu.html, demo.html
- ✅ tests.html, dashboard-integrado.html
- ✅ sincronizacion.html, admin-licencias.html

### PowerShell → scripts/deploy/
- ✅ deploy.ps1
- ✅ deploy-simple.ps1
- ✅ ejecutar-deploy.ps1
- ✅ verificar-deploy.ps1

### Documentación → docs/archive/
- ✅ REFACTORIZACION_*.md (todos)
- ✅ LINEAS_EXACTAS_*.md (todos)
- ✅ LISTA_LINEAS_ELIMINAR.txt
- ✅ ERRORES_Y_PRUEBAS.md
- ✅ ERP_STATE_MIGRATION.md

### Imágenes → Consolidar en assets/img/
- ✅ Mover todo de assets/images/ a assets/img/
- ✅ Eliminar assets/images/ (si está vacía)

## ⚠️ Actualizaciones Necesarias Después de Reorganizar

### 1. Actualizar rutas en index.html
Cambiar referencias de:
- `href="reportes.html"` → `href="pages/reportes.html"`
- `href="logistica.html"` → `href="pages/logistica.html"`
- etc.

### 2. Actualizar rutas en archivos HTML dentro de pages/
Los archivos HTML dentro de `pages/` deben actualizar sus referencias:
- Entre sí: mantener rutas relativas simples (ej: `href="configuracion.html"`)
- A assets: mantener `../assets/` o ajustar según estructura
- A index.html: usar `href="../index.html"`

### 3. Actualizar firebase.json
Verificar que la configuración de hosting tenga en cuenta la nueva estructura.

### 4. Actualizar referencias a imágenes
Cambiar `assets/images/` a `assets/img/` en todos los archivos HTML.

## 🚀 Script de Reorganización

Se han creado dos scripts para ayudar con la reorganización:
- `scripts/reorganizar.ps1` - Script PowerShell
- `scripts/reorganizar.py` - Script Python

Ejecuta uno de ellos para mover los archivos automáticamente.
