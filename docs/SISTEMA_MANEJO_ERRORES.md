# Sistema de Manejo de Errores

## Descripción

Sistema centralizado de manejo de errores que proporciona:
- **Categorización de errores** (críticos, advertencias, informativos, éxito)
- **Notificaciones visuales** al usuario para errores críticos y advertencias
- **Logs detallados** en consola para debugging
- **Historial de errores** para análisis posterior
- **Agrupación de errores similares** para evitar spam de notificaciones
- **Rate limiting** de notificaciones para no saturar la UI
- **Persistencia del historial** en localStorage
- **Panel de administración** con interfaz visual completa
- **Modo silencioso** y configuración del usuario

## Archivos Creados/Modificados

### Nuevos Archivos
- `assets/scripts/error-handler.js` - Sistema principal de manejo de errores
- `assets/scripts/error-handler-panel.js` - Panel de administración de errores (UI)
- `docs/SISTEMA_MANEJO_ERRORES.md` - Esta documentación

### Archivos Modificados
- `styles/styles.css` - Estilos para notificaciones
- `trafico.html` - Integración del sistema
- `operadores.html` - Integración del sistema
- `facturacion.html` - Integración del sistema
- `logistica.html` - Integración del sistema
- `inventario.html` - Integración del sistema
- `diesel.html` - Integración del sistema
- `assets/scripts/firebase-repo-base.js` - Uso del sistema en errores clave
- `assets/scripts/data-persistence.js` - Uso del sistema en errores clave

## Uso Básico

### Métodos de Conveniencia Globales

```javascript
// Error crítico - muestra notificación y log detallado
handleCritical('Error al guardar datos en Firebase', {
    context: { collectionName: 'trafico', documentId: '123' },
    userMessage: 'No se pudo guardar el registro. Intente nuevamente.'
});

// Advertencia - muestra notificación (si está configurado) y log
handleWarning('Datos desactualizados', {
    context: { lastSync: new Date() }
});

// Información - solo log (no muestra notificación por defecto)
handleInfo('Sincronización completada');

// Éxito - muestra notificación verde
handleSuccess('Registro guardado exitosamente');
```

### Uso con la Instancia Global

```javascript
// Acceso directo a la instancia
window.errorHandler.critical('Mensaje de error', {
    context: { /* datos adicionales */ },
    metadata: { /* metadatos personalizados */ },
    userMessage: 'Mensaje personalizado para el usuario'
});
```

### Tipos de Errores

```javascript
// Constantes disponibles
ErrorType.CRITICAL  // Error crítico - requiere atención inmediata
ErrorType.WARNING   // Advertencia - problema no crítico
ErrorType.INFO      // Información - solo para logging
ErrorType.SUCCESS   // Éxito - operación completada
```

## Configuración

### Cambiar Configuración

```javascript
// Configurar qué notificaciones mostrar
window.errorHandler.configure({
    showCriticalNotifications: true,  // Por defecto: true
    showWarningNotifications: true,   // Por defecto: true
    showInfoNotifications: false,     // Por defecto: false
    notificationDuration: {
        critical: 0,      // Sin auto-cierre
        warning: 5000,    // 5 segundos
        info: 3000,       // 3 segundos
        success: 3000     // 3 segundos
    }
});
```

## Funcionalidades Avanzadas

### Obtener Historial de Errores

```javascript
// Obtener todos los errores
const allErrors = window.errorHandler.getHistory();

// Filtrar por tipo
const criticalErrors = window.errorHandler.getHistory({ type: ErrorType.CRITICAL });

// Filtrar por fecha
const recentErrors = window.errorHandler.getHistory({
    fromDate: '2024-01-01',
    toDate: '2024-01-31'
});
```

### Exportar Historial

```javascript
// Exportar como JSON
const json = window.errorHandler.exportHistory('json');

// Exportar como CSV
const csv = window.errorHandler.exportHistory('csv');

// Guardar en archivo (ejemplo)
const blob = new Blob([csv], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'errores.csv';
a.click();
```

### Limpiar Historial

```javascript
window.errorHandler.clearHistory();
```

## Integración en Código Existente

### Reemplazo de console.error

**Antes:**
```javascript
catch (error) {
    console.error('Error al guardar:', error);
}
```

**Después:**
```javascript
catch (error) {
    if (window.errorHandler) {
        window.errorHandler.critical('Error al guardar', {
            context: { /* contexto adicional */ },
            error: error
        });
    } else {
        console.error('Error al guardar:', error);
    }
}
```

### Reemplazo de console.warn

**Antes:**
```javascript
console.warn('Advertencia: datos desactualizados');
```

**Después:**
```javascript
if (window.errorHandler) {
    window.errorHandler.warning('Datos desactualizados', {
        context: { /* contexto adicional */ }
    });
} else {
    console.warn('Advertencia: datos desactualizados');
}
```

## Características

### ✅ Notificaciones Visuales
- Toasts de Bootstrap 5
- Diseño responsive
- Auto-cierre configurable (excepto errores críticos)
- Iconos por tipo de error
- Colores diferenciados
- **Agrupación**: Errores similares se agrupan automáticamente mostrando el conteo

### ✅ Logging Detallado
- Formato estructurado en consola
- Incluye contexto, stack trace y metadatos
- Prefijos visuales (❌ ⚠️ ℹ️ ✅)
- Timestamps

### ✅ Captura Automática
- Errores no manejados (`window.onerror`)
- Promesas rechazadas (`unhandledrejection`)

### ✅ Historial
- Almacenamiento en memoria
- Límite configurable (por defecto: 100 errores)
- **Persistencia en localStorage** (se mantiene después de recargar)
- Exportación a JSON/CSV

### ✅ Agrupación de Errores
- Errores similares se agrupan automáticamente
- Ventana de tiempo configurable (60 segundos por defecto)
- Notificación muestra contador (ej: "Error X (3x)")

### ✅ Rate Limiting
- Limita cantidad de notificaciones por ventana de tiempo
- Por defecto: máximo 5 notificaciones por minuto
- Evita saturar la interfaz con demasiadas notificaciones

### ✅ Panel de Administración
- Interfaz visual completa para ver y gestionar errores
- Estadísticas en tiempo real
- Filtros por tipo y búsqueda de texto
- Ver detalles completos de cada error
- Exportar historial
- Configuración de preferencias

### ✅ Modo Silencioso
- El usuario puede activar/desactivar notificaciones
- Las preferencias se guardan en localStorage
- Los errores críticos siempre se muestran

## Ejemplos de Uso en el Código

### Ejemplo 1: Error en Guardado de Datos

```javascript
try {
    await firebaseRepo.save(id, data);
    window.errorHandler.success('Datos guardados exitosamente');
} catch (error) {
    window.errorHandler.critical('Error al guardar datos', {
        context: {
            collectionName: 'trafico',
            documentId: id,
            operation: 'save'
        },
        error: error,
        userMessage: 'No se pudieron guardar los datos. Verifique su conexión.'
    });
}
```

### Ejemplo 2: Advertencia de Cuota

```javascript
if (isQuotaExceeded) {
    window.errorHandler.warning('Cuota de Firebase excedida', {
        context: { collectionName: this.collectionName },
        userMessage: 'Los datos se guardarán localmente hasta que se recupere la conexión.'
    });
}
```

### Ejemplo 3: Información de Sincronización

```javascript
window.errorHandler.info('Iniciando sincronización', {
    context: { itemsToSync: items.length }
});
```

## Notas Importantes

1. **Compatibilidad**: El sistema verifica si Bootstrap está disponible antes de usar Toast. Si no está disponible, usa `alert()` como fallback.

2. **Orden de Carga**: El script `error-handler.js` debe cargarse **después** de Bootstrap JS pero **antes** de otros scripts que lo usen.

3. **Fallback**: Siempre se mantiene el fallback a `console.error/warn` para asegurar que los errores se registren incluso si el sistema no está disponible.

4. **Rendimiento**: Las notificaciones se muestran solo cuando es necesario para no saturar la interfaz.

## Beneficios

- ✅ **Mejor experiencia de usuario**: Notificaciones claras y visibles
- ✅ **Debugging más fácil**: Logs estructurados y detallados
- ✅ **Identificación temprana**: Captura automática de errores no manejados
- ✅ **Análisis posterior**: Historial exportable para análisis
- ✅ **Configurable**: Fácil de ajustar según necesidades

