# Plan de Refactorización de logistica.html

## Estado Actual
- **Archivo**: logistica.html
- **Tamaño**: 3885 líneas
- **JavaScript inline**: Múltiples bloques grandes

## Estructura de Archivos a Crear

### 1. `assets/scripts/logistica/sidebar-state.js` ✅ COMPLETADO
- Restaura estado del sidebar antes del render

### 2. `assets/scripts/logistica/modules-config.js`
- Configuración de módulos lazy loading
- Funciones loadModule y loadModules

### 3. `assets/scripts/logistica/init-helpers.js`
- Funciones de inicialización
- Verificación de funciones de registro
- DataPersistence fallback

### 4. `assets/scripts/logistica/export-utils.js`
- Funciones de exportación a Excel
- Utilidades (obtenerClienteNombre, pick, etc)

### 5. `assets/scripts/logistica/clientes-manager.js`
- loadClientesList
- cargarClientesEnFiltro
- cargarEconomicosEnFiltro
- loadClienteData
- refreshClientesList
- openConfiguracionClientes

### 6. `assets/scripts/logistica/registros-loader.js`
- cargarRegistrosLogistica
- Renderizado de tabla
- Paginación

### 7. `assets/scripts/logistica/filtros-manager.js`
- aplicarFiltrosLogistica
- limpiarFiltrosLogistica
- cambiarPaginaLogistica

### 8. `assets/scripts/logistica/registros-crud.js`
- verRegistroLogistica
- editarRegistroLogistica
- eliminarRegistroLogistica
- descargarPDFLogistica
- obtenerRegistroLogistica
- guardarEdicionLogistica

### 9. `assets/scripts/logistica/form-handler.js`
- clearCurrentForm
- Event listeners del formulario
- Manejo de embalaje especial

### 10. `assets/scripts/logistica/page-init.js`
- DOMContentLoaded
- Inicialización completa de la página
- Carga de datos iniciales

## Progreso
- [x] sidebar-state.js
- [ ] modules-config.js
- [ ] init-helpers.js
- [ ] export-utils.js
- [ ] clientes-manager.js
- [ ] registros-loader.js
- [ ] filtros-manager.js
- [ ] registros-crud.js
- [ ] form-handler.js
- [ ] page-init.js

## Notas
- El archivo es muy grande, se necesita refactorización cuidadosa
- Muchas funciones dependen de window.* globales
- Mantener compatibilidad con código existente

