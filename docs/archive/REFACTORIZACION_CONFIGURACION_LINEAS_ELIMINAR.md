# Refactorización de configuracion.html - Líneas a Eliminar

Este documento lista todos los bloques de código que deben ser eliminados del archivo `configuracion.html` después de la refactorización.

## ✅ Archivos Creados

Los siguientes archivos han sido creados y están siendo referenciados en el HTML:

### CSS
- `styles/configuracion.css` - Contiene todos los estilos personalizados

### JavaScript
- `assets/scripts/configuracion-sidebar.js` - Script para restaurar estado del sidebar
- `assets/scripts/configuracion-modules.js` - Sistema de carga bajo demanda
- `assets/scripts/configuracion-verificacion.js` - Verificación de funciones
- `assets/scripts/configuracion-tractocamiones.js` - Verificación de tractocamiones
- `assets/scripts/configuracion-limpieza.js` - Función de limpieza de datos
- `assets/scripts/configuracion-bancos.js` - Carga de datos de bancos

## 🗑️ Bloques a Eliminar

Todos los bloques están actualmente comentados en el HTML. Debes eliminar completamente estos bloques (incluyendo los comentarios HTML `<!-- -->`):

### 1. Bloque de Estilos CSS
**Ubicación:** En el `<head>`, después del comentario de Firebase

**Líneas aproximadas:** Buscar el bloque que comienza con:
```html
  <!-- NOTA: Los estilos han sido movidos a styles/configuracion.css -->
  <!-- BLOQUE A ELIMINAR (líneas 22-120): -->
  <!--
  <style>
```

Y termina con:
```html
  </style>
  -->
```

**Contenido:** Todo el bloque `<style>` con los estilos personalizados de pestañas, sidebar y logout-btn.

---

### 2. Bloque de Script de Sidebar
**Ubicación:** En el `<head>`, después del bloque de estilos

**Líneas aproximadas:** Buscar el bloque que comienza con:
```html
  <!-- NOTA: El script de sidebar ha sido movido a assets/scripts/configuracion-sidebar.js -->
  <!-- BLOQUE A ELIMINAR (líneas 121-169): -->
  <!--
  <!-- Script crítico: Restaurar estado del sidebar ANTES de renderizar para evitar parpadeo -->
  <script>
```

Y termina con:
```html
  </script>
  -->
```

**Contenido:** Todo el script IIFE que restaura el estado del sidebar.

---

### 3. Bloque de Script de Carga de Módulos
**Ubicación:** Después de los scripts esenciales, antes de los modales

**Líneas aproximadas:** Buscar el bloque que comienza con:
```html
  <!-- ===== SISTEMA DE CARGA BAJO DEMANDA (LAZY LOADING) ===== -->
  <!-- NOTA: Este bloque ha sido movido a configuracion-modules.js -->
  <!--
  <script>
```

Y termina con:
```html
  </script>
  -->
```

**Contenido:** Todo el script con `MODULES_CONFIG`, `loadModule`, `loadModules` y el event listener de DOMContentLoaded.

---

### 4. Bloque de Script de Verificación
**Ubicación:** Después del bloque de módulos

**Líneas aproximadas:** Buscar el bloque que comienza con:
```html
  <!-- NOTA: El script de verificación ha sido movido a assets/scripts/configuracion-verificacion.js -->
  <!-- BLOQUE A ELIMINAR (líneas 1949-1961): -->
  <!--
  <script>
    // Verificación y fallback para saveEditedCuentaBancaria
```

Y termina con:
```html
  </script>
  -->
```

**Contenido:** Script que verifica si `saveEditedCuentaBancaria` está definida.

---

### 5. Bloque de Script de Verificación de Tractocamiones
**Ubicación:** Después de los modales de edición, antes del script de limpieza

**Líneas aproximadas:** Buscar el bloque que comienza con:
```html
  <!-- NOTA: El script de verificación de tractocamiones ha sido movido a assets/scripts/configuracion-tractocamiones.js -->
  <!-- BLOQUE A ELIMINAR (líneas 2624-2691): -->
  <!--
  <script>
    // Función para verificar qué tractocamiones están realmente configurados
```

Y termina con:
```html
  </script>
  -->
```

**Contenido:** Función `window.verificarTractocamionesConfiguracion`.

---

### 6. Bloque de Script de Limpieza de Datos
**Ubicación:** Después del script de verificación de tractocamiones

**Líneas aproximadas:** Buscar el bloque que comienza con:
```html
  <!-- NOTA: El script de limpieza ha sido movido a assets/scripts/configuracion-limpieza.js -->
  <!-- BLOQUE A ELIMINAR (líneas 2694-3114): -->
  <!--
  <!-- Función para limpiar todos los datos operativos -->
  <script>
```

Y termina con:
```html
  </script>
  -->
```

**Contenido:** Función `window.limpiarTodosLosDatosOperativos` completa (es un bloque muy grande).

---

### 7. Bloque de Script de Bancos
**Ubicación:** Al final, antes del cierre de `</body>`

**Líneas aproximadas:** Buscar el bloque que comienza con:
```html
  <!-- NOTA: El script de bancos ha sido movido a assets/scripts/configuracion-bancos.js -->
  <!-- BLOQUE A ELIMINAR (líneas 3116-3128): -->
  <!--
  <script>
    // Cargar datos cuando se muestre la pestaña de Bancos
```

Y termina con:
```html
  </script>
  -->
```

**Contenido:** Script que carga datos cuando se muestra la pestaña de bancos.

---

## 📝 Notas Importantes

1. **Todos los bloques están comentados** - Los bloques están marcados con comentarios HTML `<!-- -->` para que puedas identificarlos fácilmente.

2. **Eliminar completamente** - Debes eliminar:
   - Los comentarios de "NOTA"
   - Los comentarios de "BLOQUE A ELIMINAR"
   - Todo el código comentado dentro de `<!-- -->`
   - Las etiquetas de cierre `-->`

3. **Verificar enlaces** - Asegúrate de que los siguientes enlaces estén presentes en el HTML:
   - En el `<head>`: `<link rel="stylesheet" href="styles/configuracion.css">`
   - En el `<head>`: `<script src="assets/scripts/configuracion-sidebar.js"></script>`
   - Después de los scripts esenciales:
     - `<script src="assets/scripts/configuracion-modules.js"></script>`
     - `<script src="assets/scripts/configuracion-verificacion.js"></script>`
     - `<script src="assets/scripts/configuracion-tractocamiones.js"></script>`
     - `<script src="assets/scripts/configuracion-limpieza.js"></script>`
     - `<script src="assets/scripts/configuracion-bancos.js"></script>`

4. **Orden de eliminación** - Puedes eliminar los bloques en cualquier orden, pero es recomendable hacerlo de arriba hacia abajo para mantener los números de línea consistentes.

5. **Pruebas** - Después de eliminar todos los bloques, verifica que la página funcione correctamente:
   - Las pestañas se vean correctamente
   - El sidebar funcione
   - Los módulos se carguen
   - Las funciones de verificación y limpieza funcionen
   - La pestaña de bancos cargue datos

---

## ✅ Checklist de Eliminación

- [ ] Bloque de estilos CSS (líneas ~22-120)
- [ ] Bloque de script de sidebar (líneas ~121-169)
- [ ] Bloque de script de módulos (líneas ~1855-1948)
- [ ] Bloque de script de verificación (líneas ~1949-1961)
- [ ] Bloque de script de tractocamiones (líneas ~2624-2691)
- [ ] Bloque de script de limpieza (líneas ~2694-3114)
- [ ] Bloque de script de bancos (líneas ~3116-3128)
- [ ] Verificar que todos los enlaces a archivos externos estén presentes
- [ ] Probar la funcionalidad de la página

---

**Fecha de creación:** Refactorización completada
**Estado:** Listo para eliminar bloques comentados
