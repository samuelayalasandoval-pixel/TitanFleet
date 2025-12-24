# 🔄 Actualización de logistica.html en Progreso

## ✅ Completado

1. **Referencias a archivos externos agregadas** - Todas las 15 referencias fueron agregadas después de main.js

## 🔄 En Progreso

Eliminando bloques de script inline que ya están en archivos externos:

### Bloques a Eliminar:

1. **Líneas 490-604**: MODULES_CONFIG y funciones de lazy loading (ya en `modules-config.js`)
2. **Líneas 606-680**: ensureRegistrationFunctions y ensureDataPersistence (ya en `init-helpers.js`)
3. **Líneas 795-913**: Funciones de exportación (ya en `export-utils.js`)
4. **Líneas 916-1286**: Funciones de clientes (ya en `clientes-manager.js`)
5. **Líneas 1289-1935**: Carga y renderizado de registros (ya en `registros-loader.js`)
6. **Líneas 1940-2092**: Sistema de filtros (ya en `filtros-manager.js`)
7. **Líneas 2094-3606**: Funciones CRUD (ya en archivos divididos: view, pdf, delete, edit, save, diagnostics)
8. **Líneas 3608-3681**: Manejo de formulario (ya en `form-handler.js`)
9. **Líneas 3684-3834**: Inicialización de página (ya en `page-init.js`)

## 📋 Orden de Eliminación

Se procederá a eliminar estos bloques en orden, asegurándose de que:
- No se eliminen scripts esenciales (librerías, Bootstrap, etc.)
- Se mantenga la estructura HTML
- Los atributos `onclick` se mantengan (ya que llaman a funciones globales)

## ⚠️ Nota

Los atributos `onclick` en los elementos HTML NO se eliminarán porque:
- Llaman a funciones globales (`window.*`)
- Son parte del HTML, no del JavaScript inline
- Es una práctica aceptable para eventos simples

