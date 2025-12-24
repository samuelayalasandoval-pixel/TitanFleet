# Archivos Faltantes para Completar Refactorización de logistica.html

## 📋 Resumen

Quedan 2 archivos grandes por crear para completar la refactorización de `logistica.html`:

### 1. registros-loader.js (~700 líneas)
**Ubicación en logistica.html**: Líneas 1288-1938

**Contiene**:
- `cargarRegistrosLogistica()` - Función principal de carga desde Firebase y localStorage
- `renderizarRegistrosLogistica()` - Función de renderizado de tabla paginada
- Variable global `window._registrosLogisticaCompletos`

**Funcionalidad**:
- Carga registros desde Firebase (prioridad 1)
- Carga desde erp_shared_data.registros (prioridad 2)
- Fallback a erp_logistica en modo offline (prioridad 3)
- Ordena y pagina registros
- Renderiza tabla con controles de acción

### 2. registros-crud.js (~1464 líneas)
**Ubicación en logistica.html**: Líneas 2094-3606

**Contiene**:
- `verRegistroLogistica()` - Ver detalles de un registro (líneas 2094-2340)
- `obtenerRegistroLogistica()` - Función auxiliar reutilizable (líneas 2342-2540)
- `descargarPDFLogistica()` - Generar PDF (líneas 2540-2548)
- `eliminarRegistroLogistica()` - Eliminar registro (líneas 2550-3403)
- `editarRegistroLogistica()` - Abrir modal de edición (líneas 2543-3010)
- `guardarEdicionLogistica()` - Guardar cambios (líneas 3122-3400)

**Funcionalidad**:
- Operaciones CRUD completas (Create, Read, Update, Delete)
- Generación de PDF
- Manejo de modales de Bootstrap
- Sincronización con Firebase y localStorage

## 🔄 Próximos Pasos

1. Crear `registros-loader.js` completo
2. Crear `registros-crud.js` completo
3. Actualizar `logistica.html` para referenciar todos los archivos externos
4. Eliminar todo el JavaScript inline restante
5. Verificar funcionamiento completo

## 📝 Notas Importantes

- `renderizarRegistrosLogistica()` debe ser accesible globalmente (window.renderizarRegistrosLogistica)
- Las funciones dependen de `obtenerClienteNombre()` de export-utils.js
- La paginación requiere `window._paginacionLogisticaManager`
- Los modales usan Bootstrap

