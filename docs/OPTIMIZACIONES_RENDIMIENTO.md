# Optimizaciones de Rendimiento - TitanFleet ERP

Este documento describe las optimizaciones implementadas para mejorar el rendimiento de la aplicación.

## 📋 Índice

1. [Code Splitting](#code-splitting)
2. [Optimización de Consultas Firebase](#optimización-de-consultas-firebase)
3. [Mejora del Tiempo de Carga Inicial](#mejora-del-tiempo-de-carga-inicial)
4. [Guía de Uso](#guía-de-uso)

---

## 🚀 Code Splitting

### Descripción
El sistema de Code Splitting carga módulos JavaScript solo cuando se necesitan, reduciendo el tamaño inicial del bundle y mejorando el tiempo de carga.

### Archivos Implementados
- `assets/scripts/performance/code-split-loader.js` - Cargador de módulos dinámicos

### Características
- ✅ Carga dinámica de módulos con `import()`
- ✅ Caché de módulos cargados
- ✅ Priorización de módulos (critical, high, normal, low)
- ✅ Precarga de módulos críticos

### Uso

```javascript
// Cargar un módulo bajo demanda
await window.CodeSplitLoader.loadModule('../assets/scripts/trafico/export-utils.js', {
    priority: 'normal'
});

// Precargar módulos de una página
await window.CodeSplitLoader.loadPageModules('trafico');

// Cargar módulos críticos
await window.CodeSplitLoader.loadCriticalModules();
```

---

## 🔥 Optimización de Consultas Firebase

### Descripción
Sistema de optimización que agrega paginación, límites y caché a las consultas de Firebase, reduciendo significativamente el tiempo de respuesta.

### Archivos Implementados
- `assets/scripts/performance/firebase-query-optimizer.js` - Optimizador de consultas
- Actualización en `assets/scripts/firebase-repo-base.js` - Método `getAll()` optimizado

### Características
- ✅ Paginación de consultas
- ✅ Límites configurables
- ✅ Sistema de caché con expiración (5 minutos)
- ✅ Invalidación automática de caché
- ✅ Consultas limitadas para carga inicial rápida

### Uso

#### Consulta con Límite
```javascript
// Cargar solo los primeros 50 registros
const registros = await window.firebaseRepos.trafico.getAllRegistros({
    limit: 50,
    useCache: true
});
```

#### Paginación
```javascript
// Cargar página específica
const registros = await window.firebaseRepos.trafico.getAll({
    page: 2,
    pageSize: 50,
    useCache: true
});
```

#### Usar Optimizador Directamente
```javascript
const registros = await window.FirebaseQueryOptimizer.getLimited(
    window.firebaseRepos.trafico,
    {
        limit: 30,
        useCache: true,
        orderBy: 'fechaCreacion',
        orderDirection: 'desc'
    }
);
```

#### Invalidar Caché
```javascript
// Cuando se actualiza un registro, invalidar el caché
await window.firebaseRepos.trafico.saveRegistro('2500001', datos);
window.FirebaseQueryOptimizer.invalidateCache('trafico');
```

### Beneficios
- ⚡ **Reducción de tiempo de carga**: Consultas limitadas cargan más rápido
- 💾 **Menor uso de datos**: Solo se descargan los registros necesarios
- 🔄 **Caché inteligente**: Reduce consultas repetidas a Firebase
- 📊 **Mejor escalabilidad**: Funciona bien con grandes volúmenes de datos

---

## ⚡ Mejora del Tiempo de Carga Inicial

### Descripción
Optimizaciones para reducir el tiempo de carga inicial de la página, mejorando la experiencia del usuario.

### Archivos Implementados
- `assets/scripts/performance/initial-load-optimizer.js` - Optimizador de carga inicial
- Actualización en páginas HTML (ejemplo: `pages/trafico.html`)

### Características
- ✅ Preload de recursos críticos
- ✅ Carga diferida con `defer` y `async`
- ✅ Priorización de recursos
- ✅ Métricas de rendimiento

### Cambios en HTML

#### Antes
```html
<script src="../assets/scripts/trafico/modules-config.js"></script>
<script src="../assets/scripts/trafico/page-init.js"></script>
<!-- ... 30+ scripts más ... -->
```

#### Después
```html
<!-- Scripts críticos con defer -->
<script src="../assets/scripts/trafico/modules-config.js" defer></script>
<script src="../assets/scripts/trafico/page-init.js" defer></script>

<!-- Carga diferida con Code Splitting -->
<script>
  // Cargar módulos de forma diferida
  (async function() {
    await window.CodeSplitLoader.loadPageModules('trafico');
  })();
</script>
```

### Recursos Críticos
Los siguientes recursos se cargan inmediatamente:
- Firebase Init
- Auth
- Error Handler
- Sidebar State

### Recursos Diferidos
Estos recursos se cargan después del DOM:
- Firebase Repos
- Módulos específicos de página
- Utilidades no críticas

---

## 📖 Guía de Uso

### 1. Inicialización Automática

Las optimizaciones se inicializan automáticamente al cargar la página. Solo necesitas incluir:

```html
<script src="../assets/scripts/performance/performance-init.js" defer></script>
```

### 2. Actualizar Consultas Existentes

Para optimizar consultas existentes, actualiza las llamadas a `getAll()`:

```javascript
// Antes
const registros = await repo.getAllRegistros();

// Después - Con límite
const registros = await repo.getAllRegistros({
    limit: 50,
    useCache: true
});
```

### 3. Cargar Módulos Bajo Demanda

Para funcionalidades que no se usan inmediatamente:

```javascript
// Cargar módulo de exportación solo cuando se necesite
async function exportarDatos() {
    await window.CodeSplitLoader.loadModule('../assets/scripts/trafico/export-utils.js');
    // Ahora usar la función
    window.exportarTraficoExcel();
}
```

### 4. Monitorear Rendimiento

Obtener estadísticas de rendimiento:

```javascript
const stats = window.PerformanceOptimizations.getStats();
console.log('Cache:', stats.queryCache);
console.log('Code Split:', stats.codeSplit);
console.log('Carga inicial:', stats.initialLoad);
```

### 5. Ejemplos Completos

Ver `assets/scripts/performance/usage-examples.js` para ejemplos detallados de uso.

---

## 📊 Métricas Esperadas

### Mejoras de Rendimiento

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Tiempo de carga inicial | ~5-8s | ~2-3s | **60-70%** |
| Tamaño inicial JS | ~2-3MB | ~500KB-1MB | **60-70%** |
| Tiempo de consulta Firebase | ~2-5s | ~200-500ms | **80-90%** |
| Uso de datos (primera carga) | ~5-10MB | ~1-2MB | **80%** |

### Notas
- Las métricas varían según la cantidad de datos y la conexión
- El caché mejora las consultas subsecuentes
- Code splitting reduce el tamaño inicial pero carga módulos bajo demanda

---

## 🔧 Configuración

### Habilitar/Deshabilitar Optimizaciones

```javascript
window.PerformanceOptimizations.config = {
    enableCodeSplitting: true,
    enableQueryOptimization: true,
    enableInitialLoadOptimization: true,
    debugMode: false // Cambiar a true para ver logs detallados
};
```

### Modo Debug

Para ver logs detallados de rendimiento:

```javascript
window.DEBUG_PERFORMANCE = true;
```

---

## 🐛 Solución de Problemas

### Los módulos no se cargan
- Verificar que `performance-init.js` esté cargado
- Revisar la consola para errores de carga
- Verificar rutas de los módulos

### Las consultas no usan caché
- Verificar que `FirebaseQueryOptimizer` esté disponible
- Revisar que se pase `useCache: true` en las opciones

### La página carga lento
- Verificar que los scripts tengan `defer` o `async`
- Revisar que los módulos no críticos se carguen diferidos
- Usar las herramientas de desarrollo del navegador para identificar cuellos de botella

---

## 📝 Próximos Pasos

1. **Aplicar a otras páginas**: Actualizar `logistica.html`, `facturacion.html`, etc.
2. **Índices de Firestore**: Crear índices compuestos para consultas frecuentes
3. **Service Worker**: Implementar caché offline con Service Workers
4. **Lazy Loading de Imágenes**: Cargar imágenes bajo demanda

---

## 📚 Referencias

- [Firebase Performance Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Web Performance Optimization](https://web.dev/performance/)
- [Code Splitting Guide](https://web.dev/code-splitting-suspense/)

---

**Última actualización**: 2025-01-27
