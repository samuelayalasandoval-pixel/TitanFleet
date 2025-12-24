# Sistema de Manejo de Errores Centralizado

## Descripción

El sistema de manejo de errores centralizado proporciona una solución completa para gestionar errores en toda la aplicación ERP. Incluye:

- **Centralización de errores**: Todos los errores pasan por un sistema único
- **Mensajes amigables**: Traducción automática de errores técnicos a mensajes comprensibles
- **Logging estructurado**: Logs en formato JSON para análisis y debugging
- **Notificaciones visuales**: Sistema de notificaciones integrado con Bootstrap
- **Historial de errores**: Persistencia y análisis de errores históricos

## Archivos Principales

### `error-handler.js`
Sistema principal de manejo de errores que incluye:
- Clase `ErrorHandler` para gestionar errores
- Tipos de errores: `CRITICAL`, `WARNING`, `INFO`, `SUCCESS`
- Sistema de mensajes amigables
- Logging estructurado en formato JSON
- Integración opcional con Firebase para logging remoto

### `error-utils.js`
Utilidades y helpers para facilitar el uso del sistema:
- `safeExecute()`: Wrapper para try-catch automático
- `safeFirebaseOperation()`: Manejo especializado para operaciones de Firebase
- `validateForm()`: Validación de formularios con manejo de errores
- `safeSave()`, `safeLoad()`, `safeDelete()`: Helpers para operaciones CRUD

## Uso Básico

### Manejo Simple de Errores

```javascript
// Usar el sistema global
window.handleError('Mensaje de error', window.ErrorType.WARNING);

// O usar los helpers de conveniencia
window.handleCritical('Error crítico');
window.handleWarning('Advertencia');
window.handleInfo('Información');
window.handleSuccess('Operación exitosa');
```

### Operaciones Seguras

```javascript
// Ejecutar función con manejo automático de errores
const result = await window.safeExecute(async () => {
    return await someAsyncOperation();
}, {
    errorType: window.ErrorType.WARNING,
    userMessage: 'No se pudo completar la operación',
    context: { operation: 'dataLoad' }
});

// Operaciones de Firebase
await window.safeFirebaseOperation(async () => {
    return await firebase.firestore().collection('data').get();
}, {
    userMessage: 'Error al cargar los datos',
    context: { collection: 'data' }
});
```

### Operaciones CRUD

```javascript
// Guardar datos
await window.safeSave(async () => {
    return await saveData(data);
}, {
    successMessage: 'Datos guardados correctamente',
    errorMessage: 'Error al guardar los datos',
    context: { module: 'logistica' }
});

// Cargar datos
const data = await window.safeLoad(async () => {
    return await loadData();
}, {
    errorMessage: 'Error al cargar los datos',
    context: { module: 'logistica' }
});

// Eliminar datos
await window.safeDelete(async () => {
    return await deleteData(id);
}, {
    successMessage: 'Registro eliminado correctamente',
    errorMessage: 'Error al eliminar el registro',
    context: { module: 'logistica', id: id }
});
```

### Validación de Formularios

```javascript
const validation = window.validateForm(formElement, {
    nombre: {
        required: true,
        requiredMessage: 'El nombre es obligatorio',
        minLength: 3,
        minLengthMessage: 'El nombre debe tener al menos 3 caracteres'
    },
    email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        formatMessage: 'El email no tiene un formato válido'
    }
});

if (!validation.valid) {
    // Los errores ya fueron manejados automáticamente
    return;
}
```

## Mensajes de Error Amigables

El sistema incluye un diccionario de mensajes amigables que traduce automáticamente errores técnicos:

- **Errores de Firebase**: `permission-denied`, `unavailable`, `unauthenticated`, etc.
- **Errores de validación**: `validation-error`, `required-field`, `invalid-format`
- **Errores de operación**: `save-error`, `load-error`, `delete-error`, `update-error`
- **Errores genéricos**: `unknown-error`, `timeout-error`, `not-found`

### Agregar Mensajes Personalizados

```javascript
// Los mensajes están definidos en ERROR_MESSAGES en error-handler.js
// Puedes agregar nuevos mensajes:
window.ERROR_MESSAGES['mi-error-custom'] = 'Mensaje amigable para mi error';
```

## Logging Estructurado

El sistema genera logs estructurados en formato JSON:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "error",
  "message": "Error al guardar datos",
  "errorId": "error-1234567890-abc123",
  "type": "critical",
  "source": "main.js",
  "stack": "...",
  "context": {
    "operation": "save",
    "module": "logistica"
  },
  "environment": {
    "userAgent": "...",
    "url": "http://...",
    "userId": "user123",
    "sessionId": "session-..."
  }
}
```

### Configurar Logging a Firebase

```javascript
// Habilitar logging remoto a Firebase
window.errorHandler.configure({
    logToFirebase: true,
    firebaseCollection: 'error_logs',
    logLevel: 'warning' // Solo loguear warnings y errores
});
```

## Configuración

### Configuración Básica

```javascript
// Configurar el sistema
window.errorHandler.configure({
    showNotifications: true,
    showCriticalNotifications: true,
    showWarningNotifications: true,
    showInfoNotifications: false,
    structuredLogging: true,
    friendlyMessages: true,
    logLevel: 'info'
});
```

### Modo Silencioso

```javascript
// Activar modo silencioso (no mostrar notificaciones)
window.errorHandler.setSilentMode(true);

// Desactivar modo silencioso
window.errorHandler.setSilentMode(false);
```

## Historial de Errores

### Obtener Historial

```javascript
// Obtener todos los errores
const allErrors = window.errorHandler.getHistory();

// Filtrar por tipo
const criticalErrors = window.errorHandler.getHistory({ type: 'critical' });

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

// Descargar archivo
const blob = new Blob([csv], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'error-history.csv';
a.click();
```

### Estadísticas

```javascript
const stats = window.errorHandler.getStatistics();
console.log(stats);
// {
//   total: 150,
//   byType: {
//     critical: 10,
//     warning: 50,
//     info: 80,
//     success: 10
//   },
//   groups: 5,
//   rateLimitActive: false
// }
```

## Migración de Código Existente

### Reemplazar console.error

```javascript
// Antes
console.error('Error:', error);

// Después
window.logError(error, { context: { operation: 'save' } });
// O
window.errorHandler.warning(error, { context: { operation: 'save' } });
```

### Reemplazar alert()

```javascript
// Antes
alert('Error al guardar');

// Después
window.showErrorAlert('Error al guardar', 'error');
// O
window.showAlert('Error al guardar', 'error');
```

### Reemplazar try-catch manual

```javascript
// Antes
try {
    await saveData();
} catch (error) {
    console.error('Error:', error);
    alert('Error al guardar');
}

// Después
await window.safeSave(async () => {
    return await saveData();
}, {
    successMessage: 'Datos guardados correctamente',
    errorMessage: 'Error al guardar los datos'
});
```

## Integración en HTML

Asegúrate de cargar los archivos en el orden correcto:

```html
<!-- Primero el sistema de errores -->
<script src="../assets/scripts/error-handler.js"></script>
<script src="../assets/scripts/error-utils.js"></script>

<!-- Luego el resto de tus scripts -->
<script src="../assets/scripts/main.js"></script>
```

## Mejores Prácticas

1. **Usa el sistema centralizado**: Evita `console.error` y `alert()` directos
2. **Proporciona contexto**: Siempre incluye contexto relevante en los errores
3. **Mensajes amigables**: Usa `userMessage` para mensajes que verán los usuarios
4. **Logging estructurado**: Aprovecha el logging estructurado para análisis
5. **Manejo de Firebase**: Usa `safeFirebaseOperation` para operaciones de Firebase
6. **Validación**: Usa `validateForm` para validación consistente

## Ejemplos Completos

### Ejemplo: Guardar Datos de Logística

```javascript
async function saveLogisticaData(data) {
    return await window.safeSave(async () => {
        // Guardar en localStorage
        const stored = JSON.parse(localStorage.getItem('erp_shared_data') || '{}');
        stored.registros = stored.registros || {};
        stored.registros[data.id] = data;
        localStorage.setItem('erp_shared_data', JSON.stringify(stored));
        
        // Guardar en Firebase
        if (window.firebaseRepos && window.firebaseRepos.logistica) {
            await window.safeFirebaseOperation(async () => {
                return await window.firebaseRepos.logistica.save(data.id, data);
            }, {
                userMessage: 'Error al guardar en la nube, pero se guardó localmente',
                context: { module: 'logistica', id: data.id }
            });
        }
        
        return data;
    }, {
        successMessage: 'Datos de logística guardados correctamente',
        errorMessage: 'Error al guardar los datos de logística',
        context: { module: 'logistica', operation: 'save' }
    });
}
```

### Ejemplo: Cargar Datos con Fallback

```javascript
async function loadData() {
    try {
        // Intentar cargar desde Firebase
        return await window.safeFirebaseOperation(async () => {
            const snapshot = await firebase.firestore()
                .collection('data')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }, {
            userMessage: 'Error al cargar desde la nube',
            context: { collection: 'data' }
        });
    } catch (error) {
        // Fallback a localStorage
        const localData = localStorage.getItem('erp_data');
        if (localData) {
            window.errorHandler.info('Usando datos locales como respaldo', {
                context: { source: 'localStorage' }
            });
            return JSON.parse(localData);
        }
        throw error;
    }
}
```

## Soporte

Para más información o problemas, consulta:
- Código fuente: `assets/scripts/error-handler.js`
- Utilidades: `assets/scripts/error-utils.js`
- Documentación: Este archivo
