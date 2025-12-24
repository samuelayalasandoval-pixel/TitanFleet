# Refactorización de reportes.html - Líneas a Eliminar

Este documento lista todas las líneas que deben eliminarse del archivo `reportes.html` después de la refactorización.

## Resumen de la Refactorización

Se han extraído los siguientes elementos a archivos separados:
- **Estilos CSS**: Movidos a `styles/reportes.css`
- **JavaScript inline**: Movido a `assets/scripts/reportes-inline.js`

## Líneas a Eliminar

### 1. Bloque de Estilos CSS (Líneas 19-217)

**Eliminar desde la línea 19 hasta la línea 217** (incluyendo las etiquetas `<style>` y `</style>`)

Este bloque contiene todos los estilos CSS que ahora están en `styles/reportes.css`.

**Nota**: Ya se agregó el enlace `<link rel="stylesheet" href="styles/reportes.css">` en la línea 13.

---

### 2. Bloque de JavaScript - Sidebar State (Líneas 219-266)

**Eliminar desde la línea 219 hasta la línea 266** (incluyendo las etiquetas `<script>` y `</script>`)

Este bloque contiene el código para restaurar el estado del sidebar.

**Nota**: Este código ya está en `assets/scripts/reportes-inline.js` y se carga con el script.

---

### 3. Bloque de JavaScript - Filtro de Mes (Líneas 346-372)

**Eliminar desde la línea 346 hasta la línea 372** (incluyendo las etiquetas `<script>` y `</script>`)

Este bloque contiene el código para inicializar y aplicar el filtro de mes.

**Nota**: Este código ya está en `assets/scripts/reportes-inline.js`.

---

### 4. Bloque de JavaScript - MODULES_CONFIG (Líneas 907-983)

**Eliminar desde la línea 907 hasta la línea 983** (incluyendo las etiquetas `<script>` y `</script>`)

Este bloque contiene la configuración de módulos y funciones de carga bajo demanda.

**Nota**: Este código ya está en `assets/scripts/reportes-inline.js`.

---

### 5. Bloque Grande de JavaScript - Inicialización y Funciones (Líneas 984-2669)

**Eliminar desde la línea 984 hasta la línea 2669** (incluyendo las etiquetas `<script>` y `</script>`)

Este es el bloque más grande que contiene:
- Inicialización del sistema de reportes
- Funciones de verificación y diagnóstico
- Funciones de actualización de KPIs
- Funciones de mantenimiento
- Funciones de logística
- Y muchas otras funciones auxiliares

**Nota**: Todo este código ya está en `assets/scripts/reportes-inline.js`.

---

### 6. Bloque de JavaScript - Suscripción a Económicos (Líneas 2728-2777)

**Eliminar desde la línea 2728 hasta la línea 2777** (incluyendo las etiquetas `<script>` y `</script>`)

Este bloque contiene el código para suscribirse a cambios en Firestore relacionados con económicos.

**Nota**: Este código ya está en `assets/scripts/reportes-inline.js`.

---

## IMPORTANTE: NO Eliminar

### Bloque de Firebase Module (Líneas 2672-2725)

**NO ELIMINAR** el bloque de Firebase que usa `type="module"` (líneas 2672-2725 aproximadamente).

Este bloque debe permanecer en el HTML porque:
- Usa `type="module"` con imports de ES6
- Necesita estar en el HTML para funcionar correctamente
- No se puede mover fácilmente a un archivo externo sin cambiar la estructura

---

## Verificación Final

Después de eliminar todas las líneas mencionadas, el archivo `reportes.html` debe:

1. ✅ Tener el enlace a `styles/reportes.css` en el `<head>`
2. ✅ Tener el enlace a `assets/scripts/reportes-inline.js` en el `<head>`
3. ✅ Mantener el bloque de Firebase module (type="module")
4. ✅ Mantener todos los scripts externos (Bootstrap, Chart.js, etc.)
5. ✅ Mantener toda la estructura HTML del contenido

---

## Archivos Creados

1. **styles/reportes.css**: Contiene todos los estilos CSS extraídos
2. **assets/scripts/reportes-inline.js**: Contiene todo el JavaScript inline extraído

---

## Notas Adicionales

- Los números de línea pueden variar ligeramente después de cada eliminación, por lo que se recomienda buscar los bloques por su contenido en lugar de confiar únicamente en los números de línea.
- Se recomienda hacer una copia de seguridad del archivo original antes de eliminar las líneas.
- Después de eliminar, verificar que la página funcione correctamente en el navegador.
