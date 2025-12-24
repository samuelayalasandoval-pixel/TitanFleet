# 📋 Refactorización CXP - Líneas a Eliminar

## ✅ Archivos Creados

1. **`styles/cxp.css`** - Contiene todos los estilos CSS extraídos del HTML
2. **`assets/scripts/cxp-page.js`** - Contiene todos los scripts JavaScript extraídos del HTML

## ✅ Enlaces Agregados

Los enlaces a los nuevos archivos ya están agregados en `CXP.html`:
- Línea 13: `<link rel="stylesheet" href="styles/cxp.css">`
- Línea 20: `<script src="assets/scripts/cxp-page.js"></script>`

## 🗑️ Líneas a Eliminar del Archivo CXP.html

Después de verificar que todo funciona correctamente, elimina las siguientes secciones:

### 1. Script de abrirModalNuevaFactura (temporal)
**Eliminar líneas: 21-115**

Este script ya está incluido en `assets/scripts/cxp-page.js` y se carga antes que los demás scripts.

```html
  <script>
    // Función temporal que se reemplazará cuando se cargue cxp.js
    if (typeof window.abrirModalNuevaFactura === 'undefined') {
      ...
    }
  </script>
```

### 2. Estilos CSS embebidos
**Eliminar líneas: 116-276**

Todos estos estilos ya están en `styles/cxp.css`.

```html
  <style>
    .status-badge {
      ...
    }
    ...
  </style>
```

### 3. Script de restaurar estado del sidebar
**Eliminar líneas: 277-324**

Este script ya está incluido en `assets/scripts/cxp-page.js`.

```html
  <!-- Script crítico: Restaurar estado del sidebar ANTES de renderizar para evitar parpadeo -->
  <script>
    (function() {
      ...
    })();
  </script>
```

### 4. Sistema de carga bajo demanda (lazy loading)
**Eliminar líneas: 872-950**

Este script ya está incluido en `assets/scripts/cxp-page.js`.

```html
  <script>
    const MODULES_CONFIG = {
      ...
    };
    ...
  </script>
```

## 📝 Resumen

- **Total de líneas a eliminar**: Aproximadamente 258 líneas
- **Secciones eliminadas**: 4 bloques (2 scripts y 1 bloque de estilos)
- **Archivos externos creados**: 2 (1 CSS + 1 JS)

## ⚠️ Importante

1. **Verifica primero**: Asegúrate de que la página funcione correctamente con los nuevos archivos antes de eliminar las líneas.
2. **Orden de eliminación**: Puedes eliminar todas las secciones en cualquier orden, pero es recomendable hacerlo una sección a la vez para poder verificar.
3. **Backup**: Considera hacer un backup del archivo antes de eliminar las líneas.

## ✅ Después de Eliminar

Una vez eliminadas todas las líneas, el archivo `CXP.html` quedará más limpio y organizado, con:
- Estilos en archivo CSS separado
- Scripts en archivo JS separado
- Mejor mantenibilidad y organización del código
