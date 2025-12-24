# Guía de Migración al Sistema Centralizado de Estado (ERPState)

## Resumen

Se ha creado un sistema centralizado de gestión de estado (`window.ERPState`) para reemplazar las variables globales dispersas (`window._*`, `window.__*`).

## Sistema ERPState

El sistema está definido en `assets/scripts/main.js` y proporciona una API unificada para:

- **Cachés de datos**: `operadores`, `economicos`, `economicosAlt`, `tractocamiones`
- **Estados de carga**: `operadores`, `tractocamiones`, `intentandoCargarOperadores`
- **Estado de UI**: `highlightedIndex`, `plataformaTransferir`
- **Paginación**: `plataformasDescarga`
- **Datos temporales**: `plataformasDescargaCompletas`, `plataformasDescargaCompletasSinFiltrar`
- **Observers e intervals**: `contador`, `contadorInterval`
- **Flags del sistema**: `firebaseReposReady`, `valorContadorFijo`, `proteccionContadorActiva`
- **Suscripciones**: `operadoresIncidencias`, `economicos`

## API del Sistema

### Cachés

```javascript
// Obtener caché
const operadores = window.ERPState.getCache('operadores');

// Establecer caché
window.ERPState.setCache('operadores', operadoresArray);

// Limpiar caché específico
window.ERPState.clearCache('operadores');

// Limpiar todos los cachés
window.ERPState.clearCache();
```

### Estados de Carga

```javascript
// Verificar si está cargando
if (window.ERPState.isLoading('operadores')) {
    // Ya se está cargando
}

// Establecer estado de carga
window.ERPState.setLoading('operadores', true);
window.ERPState.setLoading('operadores', false);
```

### Estado de UI

```javascript
// Highlighted Index
window.ERPState.setHighlightedIndex('operador', 0);
const index = window.ERPState.getHighlightedIndex('operador');
const allIndices = window.ERPState.getHighlightedIndex();

// Plataforma Transferir
window.ERPState.setPlataformaTransferir(identificador);
const plataforma = window.ERPState.getPlataformaTransferir();
window.ERPState.clearPlataformaTransferir();
```

### Paginación

```javascript
window.ERPState.setPagination('plataformasDescarga', paginationManager);
const pagination = window.ERPState.getPagination('plataformasDescarga');
```

### Datos Temporales

```javascript
window.ERPState.setTemp('plataformasDescargaCompletas', data);
const data = window.ERPState.getTemp('plataformasDescargaCompletas');
```

### Observers

```javascript
window.ERPState.setObserver('contador', observer);
const observer = window.ERPState.getObserver('contador');
window.ERPState.clearObserver('contador'); // Desconecta automáticamente
```

### Flags

```javascript
window.ERPState.setFlag('firebaseReposReady', promise);
const flag = window.ERPState.getFlag('firebaseReposReady');
```

### Suscripciones

```javascript
window.ERPState.setSubscription('economicos', unsubscribe);
const unsubscribe = window.ERPState.getSubscription('economicos');
window.ERPState.clearSubscription('economicos'); // Ejecuta unsubscribe automáticamente
```

### Utilidades

```javascript
// Limpiar todo el estado
window.ERPState.clearAll();

// Obtener snapshot del estado (para debugging)
const snapshot = window.ERPState.getSnapshot();
console.log(snapshot);
```

## Mapeo de Variables Antiguas a Nuevas

| Variable Antigua | Nueva API |
|-----------------|-----------|
| `window._operadoresCache` | `window.ERPState.getCache('operadores')` |
| `window._economicosCache` | `window.ERPState.getCache('economicos')` |
| `window.__economicosCache` | `window.ERPState.getCache('economicosAlt')` |
| `window._cargandoOperadoresEnCache` | `window.ERPState.isLoading('operadores')` |
| `window._intentandoCargarOperadores` | `window.ERPState.isLoading('intentandoCargarOperadores')` |
| `window._cargandoTractocamiones` | `window.ERPState.isLoading('tractocamiones')` |
| `window._highlightedIndex` | `window.ERPState.getHighlightedIndex()` |
| `window._plataformaTransferir` | `window.ERPState.getPlataformaTransferir()` |
| `window._paginacionPlataformasDescargaManager` | `window.ERPState.getPagination('plataformasDescarga')` |
| `window._plataformasDescargaCompletas` | `window.ERPState.getTemp('plataformasDescargaCompletas')` |
| `window._plataformasDescargaCompletasSinFiltrar` | `window.ERPState.getTemp('plataformasDescargaCompletasSinFiltrar')` |
| `window._contadorObserver` | `window.ERPState.getObserver('contador')` |
| `window._contadorInterval` | `window.ERPState.getObserver('contadorInterval')` |
| `window.__firebaseReposReady` | `window.ERPState.getFlag('firebaseReposReady')` |
| `window.__operadoresIncidenciasUnsubscribe` | `window.ERPState.getSubscription('operadoresIncidencias')` |
| `window.__economicosUnsub` | `window.ERPState.getSubscription('economicos')` |

## Estado de Migración

### ✅ Completado
- `assets/scripts/main.js`: Sistema ERPState creado
- `assets/scripts/inventario.js`: `_plataformaTransferir` migrado
- `operadores.html`: Parcialmente migrado (caché de operadores, loading flags)

### 🔄 Pendiente
- `operadores.html`: Completar migración de todas las referencias
- `trafico.html`: Migrar variables de estado
- `mantenimiento.html`: Migrar cachés y estados
- `diesel.html`: Migrar cachés y estados
- `inventario.html`: Migrar paginación y datos temporales

## Beneficios

1. **Centralización**: Todo el estado en un solo lugar
2. **Consistencia**: API unificada para todas las operaciones
3. **Mantenibilidad**: Más fácil de mantener y depurar
4. **Limpieza automática**: Métodos para limpiar observers y suscripciones
5. **Debugging**: Método `getSnapshot()` para inspeccionar el estado completo
6. **Type Safety**: Validación de claves (advertencias para claves desconocidas)

## Notas

- El sistema mantiene compatibilidad hacia atrás durante la migración
- Las variables antiguas pueden coexistir temporalmente
- Se recomienda migrar gradualmente, archivo por archivo
- Usar `window.ERPState.getSnapshot()` para debugging

