# Ejemplos de Migración al Sistema Centralizado de Errores

Este documento muestra ejemplos prácticos de cómo migrar código existente al nuevo sistema centralizado de manejo de errores.

## Ejemplo 1: Reemplazar console.error y alert

### Antes:
```javascript
try {
    await saveData(data);
    alert('Datos guardados correctamente');
} catch (error) {
    console.error('Error al guardar:', error);
    alert('Error al guardar los datos');
}
```

### Después:
```javascript
await window.safeSave(async () => {
    return await saveData(data);
}, {
    successMessage: 'Datos guardados correctamente',
    errorMessage: 'Error al guardar los datos',
    context: { operation: 'save', module: 'logistica' }
});
```

## Ejemplo 2: Operaciones de Firebase

### Antes:
```javascript
try {
    const docRef = firebase.firestore().collection('registros').doc(id);
    await docRef.set(data);
    console.log('Guardado exitoso');
} catch (error) {
    console.error('Error de Firebase:', error);
    if (error.code === 'permission-denied') {
        alert('No tienes permisos para realizar esta acción');
    } else {
        alert('Error al guardar en Firebase');
    }
}
```

### Después:
```javascript
await window.safeFirebaseOperation(async () => {
    const docRef = firebase.firestore().collection('registros').doc(id);
    return await docRef.set(data);
}, {
    userMessage: 'Error al guardar en Firebase',
    context: { collection: 'registros', id: id }
});
```

## Ejemplo 3: Cargar Datos con Fallback

### Antes:
```javascript
async function loadRegistros() {
    try {
        const snapshot = await firebase.firestore()
            .collection('registros')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.warn('Error cargando desde Firebase, usando localStorage:', error);
        const localData = localStorage.getItem('registros');
        if (localData) {
            return JSON.parse(localData);
        }
        throw error;
    }
}
```

### Después:
```javascript
async function loadRegistros() {
    try {
        return await window.safeFirebaseOperation(async () => {
            const snapshot = await firebase.firestore()
                .collection('registros')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }, {
            userMessage: 'Error al cargar desde la nube',
            context: { collection: 'registros' }
        });
    } catch (error) {
        // Fallback a localStorage
        const localData = localStorage.getItem('registros');
        if (localData) {
            window.errorHandler.info('Usando datos locales como respaldo', {
                context: { source: 'localStorage', collection: 'registros' }
            });
            return JSON.parse(localData);
        }
        throw error;
    }
}
```

## Ejemplo 4: Validación de Formularios

### Antes:
```javascript
function validateForm() {
    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const errors = [];

    if (!nombre) {
        errors.push('El nombre es requerido');
        alert('El nombre es requerido');
    }

    if (!email) {
        errors.push('El email es requerido');
        alert('El email es requerido');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('El email no es válido');
        alert('El email no es válido');
    }

    return errors.length === 0;
}
```

### Después:
```javascript
function validateForm() {
    const form = document.getElementById('miFormulario');
    const validation = window.validateForm(form, {
        nombre: {
            required: true,
            requiredMessage: 'El nombre es requerido',
            minLength: 3,
            minLengthMessage: 'El nombre debe tener al menos 3 caracteres'
        },
        email: {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            formatMessage: 'El email no tiene un formato válido'
        }
    });

    return validation.valid;
}
```

## Ejemplo 5: Operaciones CRUD Completas

### Antes:
```javascript
// Guardar
async function saveRegistro(data) {
    try {
        await firebase.firestore().collection('registros').add(data);
        alert('Registro guardado correctamente');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar');
    }
}

// Cargar
async function loadRegistros() {
    try {
        const snapshot = await firebase.firestore()
            .collection('registros')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar');
        return [];
    }
}

// Eliminar
async function deleteRegistro(id) {
    try {
        await firebase.firestore().collection('registros').doc(id).delete();
        alert('Registro eliminado');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar');
    }
}
```

### Después:
```javascript
// Guardar
async function saveRegistro(data) {
    return await window.safeSave(async () => {
        const docRef = await firebase.firestore()
            .collection('registros')
            .add(data);
        return docRef.id;
    }, {
        successMessage: 'Registro guardado correctamente',
        errorMessage: 'Error al guardar el registro',
        context: { operation: 'save', collection: 'registros' }
    });
}

// Cargar
async function loadRegistros() {
    return await window.safeLoad(async () => {
        const snapshot = await firebase.firestore()
            .collection('registros')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }, {
        errorMessage: 'Error al cargar los registros',
        context: { operation: 'load', collection: 'registros' }
    });
}

// Eliminar
async function deleteRegistro(id) {
    return await window.safeDelete(async () => {
        await firebase.firestore()
            .collection('registros')
            .doc(id)
            .delete();
    }, {
        successMessage: 'Registro eliminado correctamente',
        errorMessage: 'Error al eliminar el registro',
        context: { operation: 'delete', collection: 'registros', id: id }
    });
}
```

## Ejemplo 6: Manejo de Errores en Event Handlers

### Antes:
```javascript
document.getElementById('btnGuardar').addEventListener('click', async () => {
    try {
        const data = getFormData();
        await saveData(data);
        alert('Guardado exitoso');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar');
    }
});
```

### Después:
```javascript
document.getElementById('btnGuardar').addEventListener('click', async () => {
    await window.safeExecute(async () => {
        const data = getFormData();
        return await saveData(data);
    }, {
        errorType: window.ErrorType.WARNING,
        userMessage: 'Error al guardar los datos',
        context: { handler: 'btnGuardar', operation: 'save' },
        onError: (error) => {
            // Lógica adicional si es necesario
            console.log('Error capturado:', error);
        }
    });
});
```

## Ejemplo 7: Reemplazar showNotification Existente

### Antes:
```javascript
if (typeof window.showNotification === 'function') {
    window.showNotification('Error al guardar', 'error');
} else {
    alert('Error al guardar');
}
```

### Después:
```javascript
// El sistema ya tiene showNotification integrado
window.showNotification('Error al guardar', 'error');

// O usar directamente el sistema
window.errorHandler.critical('Error al guardar', {
    userMessage: 'No se pudieron guardar los datos. Por favor, intenta nuevamente.'
});
```

## Ejemplo 8: Logging Estructurado Personalizado

### Antes:
```javascript
console.log('Operación iniciada:', { userId: user.id, action: 'save' });
console.error('Error:', error);
```

### Después:
```javascript
// El sistema ya hace logging estructurado automáticamente
// Pero puedes agregar logs personalizados:
window.errorHandler.logStructured('info', 'Operación iniciada', {
    userId: user.id,
    action: 'save',
    module: 'logistica'
});

// Los errores se loguean automáticamente con contexto completo
window.errorHandler.warning(error, {
    context: { userId: user.id, action: 'save' }
});
```

## Beneficios de la Migración

1. **Código más limpio**: Menos código repetitivo
2. **Mensajes consistentes**: Todos los errores usan el mismo formato
3. **Mejor UX**: Mensajes amigables para usuarios
4. **Mejor debugging**: Logs estructurados facilitan el análisis
5. **Centralización**: Un solo lugar para gestionar errores
6. **Mantenibilidad**: Cambios en un solo lugar afectan toda la app

## Checklist de Migración

- [ ] Reemplazar todos los `console.error` por `window.logError` o `window.errorHandler.warning/critical`
- [ ] Reemplazar todos los `alert()` por `window.showAlert` o `window.showNotification`
- [ ] Envolver operaciones async en `window.safeExecute` o helpers específicos
- [ ] Usar `window.safeFirebaseOperation` para operaciones de Firebase
- [ ] Usar `window.validateForm` para validación de formularios
- [ ] Usar `window.safeSave`, `window.safeLoad`, `window.safeDelete` para operaciones CRUD
- [ ] Agregar contexto relevante a todos los errores
- [ ] Probar que los mensajes de error sean amigables para usuarios
