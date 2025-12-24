# Líneas Exactas a Eliminar en reportes.html

Archivo actual tiene **2433 líneas**. Eliminar los siguientes bloques:

## ✅ BLOQUE 1: Script de Sidebar State

**ELIMINAR LÍNEAS: 24-71**

```html
    <script>
      (function() {
        'use strict';
        // ... (todo el contenido hasta ...)
      })();
    </script>
```

**Razón**: Este código ya está en `assets/scripts/reportes-inline.js`

---

## ✅ BLOQUE 2: Bloque Grande de JavaScript (Inicialización y Funciones)

**ELIMINAR LÍNEAS: 689-2371**

Este bloque contiene:
- Inicialización del sistema de reportes
- Todas las funciones de verificación
- Funciones de actualización de KPIs
- Funciones de mantenimiento
- Funciones de logística
- Y muchas otras funciones auxiliares

**IMPORTANTE**: 
- La línea 689 empieza con código JavaScript sin etiqueta `<script>` (parece que se eliminó la etiqueta de apertura en una edición anterior)
- La línea 2371 tiene `</script>` que cierra este bloque
- **Eliminar desde la línea 689 hasta la línea 2371 (incluyendo ambas)**

**Razón**: Todo este código ya está en `assets/scripts/reportes-inline.js`

---

## ❌ NO ELIMINAR

### Bloque de Firebase Module (Líneas 2374-2428)

**NO ELIMINAR** las líneas 2374-2428

Este bloque contiene:
```html
    <!-- Firebase SDK -->
    <script type="module">
        import { initializeApp, getApps, getApp } from '...';
        // ... código de Firebase ...
    </script>
```

**Razón**: Este bloque usa `type="module"` y debe permanecer en el HTML.

---

## Resumen de Eliminaciones

| Bloque | Líneas a Eliminar | Contenido |
|--------|-------------------|-----------|
| 1 | **24-71** | Script de sidebar state |
| 2 | **689-2371** | Bloque grande de JavaScript (inicialización y funciones) |

**Total de líneas a eliminar**: ~1,360 líneas

---

## Verificación Después de Eliminar

Después de eliminar estos bloques, el archivo debe:

1. ✅ Tener el enlace a `styles/reportes.css` en la línea 13
2. ✅ Tener el enlace a `assets/scripts/reportes-inline.js` en la línea 23
3. ✅ Mantener el bloque de Firebase module (líneas 2374-2428)
4. ✅ Mantener todos los scripts externos (Bootstrap, Chart.js, etc.)
5. ✅ Mantener toda la estructura HTML del contenido

---

## Nota Importante

⚠️ **La línea 689 parece tener código JavaScript sin etiqueta `<script>` de apertura**. Esto sugiere que en una edición anterior se eliminó la etiqueta pero no el contenido. Al eliminar el bloque 2 (líneas 689-2371), se eliminará todo este código JavaScript suelto.

Si después de eliminar encuentras que falta alguna etiqueta de cierre o hay algún error de sintaxis, verifica que:
- No queden etiquetas `</script>` sin su correspondiente `<script>`
- El bloque de Firebase module esté completo
- Los comentarios HTML estén bien formados
