# Módulos Compartidos - Guía de Reutilización

## 📋 Resumen

Este documento describe qué módulos de `trafico.html` pueden reutilizarse en otras hojas del sistema ERP.

## ✅ Módulos Reutilizables

### 1. **`shared/sidebar-state.js`** ⭐ **ALTAMENTE RECOMENDADO**
- **Descripción**: Restaura el estado del sidebar (colapsado/expandido) antes de renderizar
- **Uso**: Cualquier página con sidebar
- **Ubicación actual**: 
  - `assets/scripts/trafico/sidebar-state.js`
  - `assets/scripts/logistica/sidebar-state.js`
  - `assets/scripts/menu/sidebar-state.js`
- **Acción**: ✅ **Ya creado en `assets/scripts/shared/sidebar-state.js`**
- **Cómo usar**: 
  ```html
  <script src="assets/scripts/shared/sidebar-state.js"></script>
  ```

### 2. **`shared/modules-config.js`** (Estructura base)
- **Descripción**: Sistema de carga lazy de módulos JavaScript
- **Uso**: Cualquier página que necesite carga bajo demanda
- **Nota**: La configuración específica de módulos debe personalizarse por página
- **Recomendación**: Crear una versión base compartida y extenderla por módulo

### 3. **`shared/form-utils.js`** (Versión genérica)
- **Descripción**: Utilidades genéricas para limpiar formularios
- **Uso**: Cualquier página con formularios
- **Nota**: El actual `form-utils.js` de tráfico es específico, pero puede generalizarse
- **Recomendación**: Crear versión genérica y específica por módulo si es necesario

### 4. **`shared/export-utils-advanced.js`**
- **Descripción**: Funciones avanzadas de exportación (Excel/CSV con fallback)
- **Uso**: Cualquier página que exporte datos
- **Funciones**:
  - `ensureXLSX()` - Carga dinámica de SheetJS
  - `descargarCSV()` - Exportación a CSV
  - `limpiarCaracteresEspeciales()` - Limpieza de caracteres
- **Recomendación**: ✅ **Mover a `shared/` y actualizar referencias**

### 5. **`shared/init-helpers.js`** (Versión genérica)
- **Descripción**: Helpers para inicialización de página
- **Uso**: Cualquier página que necesite inicialización temprana
- **Nota**: El actual es específico de tráfico, pero puede generalizarse

## ❌ Módulos Específicos de Tráfico (NO reutilizables)

Estos módulos son específicos de la funcionalidad de tráfico:

- `buzon-pendientes.js` - Buzón de pendientes de tráfico
- `registros-loader.js` - Carga de registros de tráfico
- `filtros-manager.js` - Filtros específicos de tráfico
- `descarga-manager.js` - Modal de descarga de plataforma
- `validation-utils.js` - Validación de números de registro
- `counter-utils.js` - Contador de pendientes de tráfico
- `autocomplete-manager.js` - Autocompletado de económicos/operadores (podría adaptarse)
- `form-handler.js` - Manejo de formularios de tráfico
- `form-submit-handler.js` - Envío de formularios de tráfico
- `cliente-utils.js` - Utilidades de cliente para tráfico
- `edit-manager.js` - Edición de registros de tráfico
- `gastos-sync-manager.js` - Sincronización de gastos
- `sync-utils.js` - Sincronización específica de tráfico
- `counter-advanced.js` - Contador avanzado de tráfico
- `pagination-utils.js` - Paginación de tráfico

## 🔄 Plan de Migración

### Paso 1: Mover `sidebar-state.js` a compartido ✅
```bash
# Ya creado en assets/scripts/shared/sidebar-state.js
```

### Paso 2: Actualizar referencias en HTML
```html
<!-- Antes -->
<script src="assets/scripts/trafico/sidebar-state.js"></script>

<!-- Después -->
<script src="assets/scripts/shared/sidebar-state.js"></script>
```

### Paso 3: Mover `export-utils-advanced.js` a compartido
```bash
# Mover y actualizar referencias
mv assets/scripts/trafico/export-utils-advanced.js assets/scripts/shared/
```

### Paso 4: Crear versiones genéricas de otros módulos
- `shared/modules-config-base.js` - Estructura base
- `shared/form-utils-base.js` - Utilidades genéricas de formularios

## 📊 Beneficios de Reutilización

1. **Mantenibilidad**: Un solo lugar para actualizar código común
2. **Consistencia**: Comportamiento uniforme en todas las páginas
3. **Reducción de código**: Menos duplicación
4. **Facilidad de testing**: Un solo módulo para probar

## 🎯 Próximos Pasos Recomendados

1. ✅ Crear `shared/sidebar-state.js` (COMPLETADO)
2. ⏳ Mover `export-utils-advanced.js` a `shared/`
3. ⏳ Actualizar referencias en `trafico.html`, `logistica.html`, `menu.html`
4. ⏳ Crear versiones genéricas de `modules-config` y `form-utils`
5. ⏳ Documentar patrones de reutilización

## 📝 Notas

- Los módulos compartidos deben ser **genéricos** y **configurables**
- Si un módulo necesita personalización, crear una versión base compartida y extenderla
- Mantener compatibilidad hacia atrás al migrar módulos

