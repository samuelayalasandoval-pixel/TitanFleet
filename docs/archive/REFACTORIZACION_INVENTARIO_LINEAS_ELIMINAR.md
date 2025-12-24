# Refactorización de inventario.html - Líneas a Eliminar

## ✅ Archivos Creados

1. **`styles/inventario.css`** - Contiene todos los estilos CSS específicos de la página
2. **`assets/scripts/inventario-page.js`** - Contiene todo el JavaScript específico de la página

## ✅ Enlaces Agregados

Los enlaces a los nuevos archivos ya han sido agregados en `inventario.html`:
- Línea 13: `<link rel="stylesheet" href="styles/inventario.css">`
- Línea 855: `<script src="assets/scripts/inventario-page.js"></script>`

## 📋 Líneas a Eliminar del HTML

### 1. Eliminar el bloque de estilos CSS (líneas 19-137)

**Desde la línea 19 hasta la línea 137 (ambas inclusive)**

Esto incluye:
- La etiqueta `<style>` de apertura
- Todos los estilos CSS dentro
- La etiqueta `</style>` de cierre

**Bloque completo a eliminar:**
```html
  <style>
    .nav-tabs {
      ...
    }
    ...
  </style>
```

### 2. Eliminar el script de restauración del sidebar (líneas 139-186)

**Desde la línea 139 hasta la línea 186 (ambas inclusive)**

**Bloque completo a eliminar:**
```html
  <script>
    (function() {
      'use strict';
      // Leer estado del sidebar inmediatamente
      ...
    })();
  </script>
```

### 3. Eliminar el script de ensureDataPersistence (líneas 187-197)

**Desde la línea 187 hasta la línea 197 (ambas inclusive)**

**Bloque completo a eliminar:**
```html
  <script>
    // Carga de respaldo mínima de DataPersistence
    function ensureDataPersistence() {
      ...
    }
  </script>
```

### 4. Eliminar el sistema de módulos (líneas 857-920)

**Desde la línea 857 hasta la línea 920 (ambas inclusive)**

**Bloque completo a eliminar:**
```html
  <script>
    const MODULES_CONFIG = {
      ...
    };
    ...
  </script>
```

### 5. Eliminar la llamada ensureDataPersistence (línea 921)

**Eliminar la línea 921 completa:**

```html
  <script>ensureDataPersistence();</script>
```

### 6. Eliminar todo el script grande de plataformas y exportación (líneas 923-1673)

**Desde la línea 923 hasta la línea 1673 (ambas inclusive)**

Este es un bloque grande que incluye:
- Actualización de panel de plataformas cargadas
- Funciones de renderizado
- Funciones de filtros
- Funciones de exportación a Excel
- Inicialización del inventario

**Bloque completo a eliminar:**
```html
  <script>
    // Actualizar panel de plataformas cargadas
    window.actualizarPanelPlataformasCargadas = async function() {
      ...
    };
    ...
  </script>
```

## 📝 Resumen de Líneas a Eliminar

| Bloque | Líneas | Contenido |
|--------|--------|-----------|
| 1 | 19-137 | Estilos CSS (incluye `<style>` y `</style>`) |
| 2 | 139-186 | Script de restauración del sidebar |
| 3 | 187-197 | Script ensureDataPersistence |
| 4 | 857-920 | Sistema de módulos (MODULES_CONFIG) |
| 5 | 921 | Llamada ensureDataPersistence() |
| 6 | 923-1673 | Script grande de plataformas y exportación |

**Total de líneas a eliminar:** Aproximadamente 1,554 líneas

## ⚠️ Nota Importante

Después de eliminar estas líneas, el código habrá sido completamente refactorizado y todo funcionará desde los archivos externos:
- Los estilos se cargarán desde `styles/inventario.css`
- El JavaScript se cargará desde `assets/scripts/inventario-page.js`

## ✅ Verificación

Después de eliminar las líneas, verifica que:
1. La página carga correctamente
2. Los estilos se aplican bien
3. El JavaScript funciona (sidebar, plataformas, exportación, etc.)
4. No hay errores en la consola del navegador
