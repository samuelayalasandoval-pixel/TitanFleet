# Refactorización de inventario.html - Líneas FALTANTES por Eliminar

## ✅ Ya Eliminado (por el usuario)

- ✅ Estilos CSS (líneas 19-137 originales)
- ✅ Script de restauración del sidebar (líneas 139-186 originales)  
- ✅ Script ensureDataPersistence (líneas 187-197 originales)

## ⚠️ LÍNEAS QUE AÚN FALTAN ELIMINAR

Después de que eliminaste las primeras líneas, los números de línea cambiaron. Aquí están las líneas **ACTUALES** que aún debes eliminar:

### 1. Eliminar el comentario y sistema de módulos (LAZY LOADING)

**Desde la línea 680 hasta la línea 744 (ambas inclusive)**

Esto incluye:
- El comentario `<!-- ===== SISTEMA DE CARGA BAJO DEMANDA (LAZY LOADING) ===== -->`
- Todo el bloque `<script>` con `MODULES_CONFIG`, `loadModule`, `loadModules`, etc.

**Líneas exactas:** **680-744**

---

### 2. Eliminar la llamada ensureDataPersistence()

**Línea 745 completa**

**Línea exacta:** **745**

Eliminar esta línea completa:
```html
  <script>ensureDataPersistence();</script>
```

---

### 3. Eliminar TODO el script grande de plataformas y exportación

**Desde la línea 747 hasta la línea 1497 (ambas inclusive)**

Esto incluye:
- El comentario `<!-- Script movido a carga bajo demanda arriba -->` (línea 1498 también, pero está después del `</script>`)
- Todo el bloque `<script>` enorme que contiene:
  - `actualizarPanelPlataformasCargadas`
  - `renderizarPlataformasDescargaPaginadas`
  - `renderizarPlataformasDescargaDirectamente`
  - `aplicarFiltrosPlataformasDescarga`
  - `cambiarPaginaPlataformasDescarga`
  - Inicialización del inventario
  - Funciones de exportación a Excel

**Líneas exactas:** **747-1497**

También puedes eliminar la línea 1498 si quieres (el comentario):
**Línea 1498** (opcional):
```html
    <!-- Script movido a carga bajo demanda arriba -->
```

---

## 📋 Resumen de Líneas ACTUALES a Eliminar

| Bloque | Líneas Actuales | Contenido | Tamaño |
|--------|----------------|-----------|--------|
| 1 | **680-744** | Sistema de módulos (MODULES_CONFIG) | ~65 líneas |
| 2 | **745** | Llamada ensureDataPersistence() | 1 línea |
| 3 | **747-1497** | Script grande de plataformas y exportación | ~751 líneas |
| 4 (opcional) | **1498** | Comentario | 1 línea |

**Total de líneas a eliminar:** Aproximadamente **817 líneas**

---

## 🎯 Instrucciones Paso a Paso

### Paso 1: Eliminar sistema de módulos
1. Busca la línea que dice: `<!-- ===== SISTEMA DE CARGA BAJO DEMANDA (LAZY LOADING) ===== -->`
2. Desde esa línea, elimina todo hasta (e incluyendo) la línea con `</script>` que cierra ese bloque
3. Deberías eliminar aproximadamente desde la línea 680 hasta la línea 744

### Paso 2: Eliminar llamada ensureDataPersistence
1. Busca la línea que dice: `<script>ensureDataPersistence();</script>`
2. Elimina esa línea completa (línea 745)

### Paso 3: Eliminar script grande
1. Busca la línea que dice: `// Actualizar panel de plataformas cargadas`
2. Desde esa línea (después del `<script>` anterior), elimina todo hasta (e incluyendo) la línea con `</script>` que cierra ese bloque
3. Deberías eliminar aproximadamente desde la línea 747 hasta la línea 1497

---

## ✅ Después de Eliminar

Después de eliminar todas estas líneas, el archivo debería terminar con:

```html
  <script src="assets/scripts/inventario.js"></script>
  <script src="assets/scripts/inventario-page.js"></script>
  
</body>
</html>
```

---

## ⚠️ Nota Importante

Todo este código ya está en el archivo externo:
- **`assets/scripts/inventario-page.js`** - Contiene todo el JavaScript que estás eliminando
- **`styles/inventario.css`** - Contiene todos los estilos CSS que ya eliminaste

Los enlaces a estos archivos ya están agregados en el HTML (líneas 13 y 678), así que todo seguirá funcionando correctamente después de eliminar estas líneas.

---

## 🔍 Cómo Verificar que Estás en las Líneas Correctas

Para asegurarte de que estás eliminando las líneas correctas, busca estos marcadores:

1. **Para el bloque 1 (sistema de módulos):**
   - Busca: `<!-- ===== SISTEMA DE CARGA BAJO DEMANDA (LAZY LOADING) ===== -->`
   - Debería estar alrededor de la línea 680

2. **Para el bloque 2 (ensureDataPersistence):**
   - Busca: `<script>ensureDataPersistence();</script>`
   - Debería estar alrededor de la línea 745

3. **Para el bloque 3 (script grande):**
   - Busca: `// Actualizar panel de plataformas cargadas`
   - Debería estar alrededor de la línea 748
   - El bloque termina con `</script>` antes de `<!-- Script movido... -->`
