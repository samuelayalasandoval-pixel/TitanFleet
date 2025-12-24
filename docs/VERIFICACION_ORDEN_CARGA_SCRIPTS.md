# Verificación del Orden de Carga de Scripts

## 📋 Orden Correcto que TODAS las páginas deben seguir

### FASE 1: Scripts Críticos (SIN defer - se ejecutan inmediatamente)
```html
<!-- 1. Bootstrap (requerido para modales) -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>

<!-- 2. auth.js (DEBE cargarse PRIMERO para aplicar permisos) -->
<script src="../assets/scripts/auth.js"></script>

<!-- 3. cache-manager.js (si la página usa caché) -->
<script src="../assets/scripts/cache-manager.js"></script>

<!-- 4. data-persistence.js (si la página guarda datos) -->
<script src="../assets/scripts/data-persistence.js"></script>

<!-- 5. Scripts específicos críticos de la página (sin defer) -->
<!-- Ejemplo: periodo.js, sidebar-state.js, etc. -->
```

### FASE 2: Firebase (SIN defer - se ejecutan inmediatamente)
```html
<!-- 6. firebase-init.js (PRIMERO - inicializa Firebase) -->
<script type="module" src="../assets/scripts/firebase-init.js"></script>

<!-- 7. firebase-ready.js (DESPUÉS de firebase-init.js) -->
<script src="../assets/scripts/firebase-ready.js"></script>
```

### FASE 3: Scripts con defer (se ejecutan cuando DOM está listo)
```html
<!-- 8. Performance optimizations -->
<script src="../assets/scripts/performance/performance-init.js" defer></script>
<script src="../assets/scripts/performance/common-head-loader.js"></script>
<script src="../assets/scripts/script-loader.js" defer></script>

<!-- 9. main.js (funciones base) -->
<script src="../assets/scripts/main.js" defer></script>

<!-- 10. firebase-repo-base.js (ANTES de firebase-repos.js) -->
<script src="../assets/scripts/firebase-repo-base.js" defer></script>

<!-- 11. firebase-repos.js (DESPUÉS de firebase-repo-base.js) -->
<script src="../assets/scripts/firebase-repos.js" defer></script>

<!-- 12. Scripts compartidos -->
<script src="../assets/scripts/shared/event-handlers.js" defer></script>

<!-- 13. Scripts específicos del módulo (con defer) -->
<!-- Ejemplo: facturacion/registros-loader.js, trafico/form-handler.js, etc. -->

<!-- 14. Utilidades y limpieza -->
<script src="../assets/scripts/localstorage-cleanup.js" defer></script>
```

## ✅ Páginas que SÍ siguen el orden correcto

### 1. facturacion.html
- ✅ auth.js antes de otros scripts
- ✅ firebase-init.js antes de firebase-repo-base.js
- ✅ firebase-repo-base.js antes de firebase-repos.js
- ✅ cache-manager.js sin defer
- ⚠️ PERO: data-persistence.js está en módulos específicos (debería estar antes)

### 2. tesoreria.html
- ✅ Orden correcto
- ✅ Todos los scripts críticos en el lugar adecuado

### 3. CXC.html
- ✅ Orden correcto
- ✅ Todos los scripts críticos en el lugar adecuado

### 4. CXP.html
- ✅ Orden correcto
- ✅ Todos los scripts críticos en el lugar adecuado

### 5. operadores.html
- ✅ Orden correcto
- ✅ Todos los scripts críticos en el lugar adecuado

## ⚠️ Páginas con problemas de orden

### 1. trafico.html
**Problemas encontrados:**
- ❌ `data-persistence.js` está en la línea 78 (después de otros scripts)
- ❌ `firebase-init.js` está en la línea 93 (debería estar antes)
- ❌ `firebase-ready.js` está en la línea 95 (debería estar después de firebase-init.js)
- ❌ `firebase-repo-base.js` y `firebase-repos.js` están al final (líneas 97-99)

**Orden actual (INCORRECTO):**
```
1. auth.js (línea 57) ✅
2. cache-manager.js (línea 70) ✅
3. ... scripts del módulo ...
4. data-persistence.js (línea 78) ❌ (debería estar antes)
5. ... más scripts del módulo ...
6. firebase-init.js (línea 93) ❌ (debería estar antes)
7. firebase-ready.js (línea 95) ✅
8. firebase-repo-base.js (línea 97) ❌ (debería estar antes, con defer)
9. firebase-repos.js (línea 99) ✅
```

**Orden correcto debería ser:**
```
1. auth.js
2. cache-manager.js
3. data-persistence.js (sin defer)
4. firebase-init.js (type="module")
5. firebase-ready.js
6. ... scripts con defer del módulo ...
7. firebase-repo-base.js (defer)
8. firebase-repos.js (defer)
```

### 2. logistica.html
**Problemas encontrados:**
- ❌ `data-persistence.js` está en la línea 68 (después de auth.js, pero antes de main.js)
- ❌ `main.js` está SIN defer (línea 70) - esto está bien si es necesario
- ❌ `firebase-init.js` está en la línea 89 (debería estar antes)
- ❌ `firebase-repo-base.js` y `firebase-repos.js` están al final (líneas 93-95)

**Orden actual (PARCIALMENTE CORRECTO):**
```
1. auth.js (línea 59) ✅
2. cache-manager.js (línea 73) ✅
3. data-persistence.js (línea 68) ⚠️ (está bien, pero podría estar antes)
4. main.js (línea 70, sin defer) ⚠️ (está bien si es necesario)
5. ... scripts del módulo ...
6. firebase-init.js (línea 89) ❌ (debería estar antes)
7. firebase-ready.js (línea 91) ✅
8. firebase-repo-base.js (línea 93) ❌ (debería estar antes, con defer)
9. firebase-repos.js (línea 95) ✅
```

## 📊 Resumen de Verificación

| Página | auth.js | Firebase Init | Firebase Repos | data-persistence | Estado |
|--------|---------|---------------|----------------|------------------|--------|
| facturacion.html | ✅ | ✅ | ✅ | ✅ | ✅ **CORREGIDO** |
| trafico.html | ✅ | ✅ | ✅ | ✅ | ✅ **CORREGIDO** |
| logistica.html | ✅ | ✅ | ✅ | ✅ | ✅ **CORREGIDO** |
| tesoreria.html | ✅ | ✅ | ✅ | N/A | ✅ Correcto |
| CXC.html | ✅ | ✅ | ✅ | N/A | ✅ Correcto |
| CXP.html | ✅ | ✅ | ✅ | N/A | ✅ Correcto |
| operadores.html | ✅ | ✅ | ✅ | N/A | ✅ Correcto |
| diesel.html | ✅ | ✅ | ✅ | N/A | ✅ Correcto |
| mantenimiento.html | ✅ | ✅ | ✅ | N/A | ✅ Correcto |
| inventario.html | ✅ | ✅ | ✅ | N/A | ✅ Correcto |
| configuracion.html | ✅ | ✅ | ✅ | N/A | ✅ Correcto |
| reportes.html | ✅ | ✅ | ✅ | N/A | ✅ **CORREGIDO** |

## ✅ Correcciones Realizadas

### trafico.html ✅ CORREGIDO
**Cambios aplicados:**
1. ✅ `data-persistence.js` movido después de `cache-manager.js` (sin defer)
2. ✅ `firebase-init.js` movido después de `auth.js` (type="module")
3. ✅ `firebase-ready.js` movido después de `firebase-init.js`
4. ✅ `firebase-repo-base.js` y `firebase-repos.js` movidos antes de los scripts del módulo (con defer)

**Nuevo orden (CORRECTO):**
```
1. auth.js ✅
2. cache-manager.js ✅
3. data-persistence.js ✅
4. firebase-init.js ✅
5. firebase-ready.js ✅
6. main.js (defer) ✅
7. firebase-repo-base.js (defer) ✅
8. firebase-repos.js (defer) ✅
9. ... scripts del módulo con defer ...
```

### logistica.html ✅ CORREGIDO
**Cambios aplicados:**
1. ✅ `firebase-init.js` movido después de `auth.js` (type="module")
2. ✅ `firebase-ready.js` movido después de `firebase-init.js`
3. ✅ `firebase-repo-base.js` y `firebase-repos.js` movidos antes de los scripts del módulo (con defer)

**Nuevo orden (CORRECTO):**
```
1. auth.js ✅
2. cache-manager.js ✅
3. data-persistence.js ✅
4. firebase-init.js ✅
5. firebase-ready.js ✅
6. main.js ✅
7. firebase-repo-base.js (defer) ✅
8. firebase-repos.js (defer) ✅
9. ... scripts del módulo con defer ...
```

### facturacion.html ✅ CORREGIDO
**Cambios aplicados:**
1. ✅ `data-persistence.js` movido a la sección de scripts críticos (después de `cache-manager.js`)

**Nuevo orden (CORRECTO):**
```
1. auth.js ✅
2. cache-manager.js ✅
3. data-persistence.js ✅
4. firebase-init.js ✅
5. firebase-ready.js ✅
6. firebase-repo-base.js (defer) ✅
7. firebase-repos.js (defer) ✅
8. ... scripts del módulo ...
```

### reportes.html ✅ CORREGIDO
**Cambios aplicados:**
1. ✅ `cache-manager.js` movido antes de `firebase-init.js`

**Nuevo orden (CORRECTO):**
```
1. auth.js ✅
2. periodo.js ✅
3. cache-manager.js ✅
4. firebase-init.js ✅
5. firebase-ready.js ✅
6. firebase-repo-base.js (defer) ✅
7. firebase-repos.js (defer) ✅
8. ... scripts del módulo con defer ...
```

## 📝 Plantilla de Orden Correcto para Nuevas Páginas

```html
<head>
  <!-- ... meta tags y estilos ... -->
  
  <!-- Bootstrap (SIN defer) -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
  
  <!-- Performance Optimizations (con defer) -->
  <script src="../assets/scripts/performance/performance-init.js" defer></script>
  
  <!-- ===== FASE 1: Scripts Críticos (SIN defer) ===== -->
  <!-- 1. auth.js (PRIMERO - aplica permisos) -->
  <script src="../assets/scripts/auth.js"></script>
  
  <!-- 2. common-head-loader.js (después de auth.js) -->
  <script src="../assets/scripts/performance/common-head-loader.js"></script>
  <script src="../assets/scripts/script-loader.js" defer></script>
  
  <!-- 3. cache-manager.js (si se usa caché) -->
  <script src="../assets/scripts/cache-manager.js"></script>
  
  <!-- 4. data-persistence.js (si se guardan datos) -->
  <script src="../assets/scripts/data-persistence.js"></script>
  
  <!-- 5. Scripts críticos específicos (sin defer si es necesario) -->
  <script src="../assets/scripts/periodo.js"></script>
  <script src="../assets/scripts/[modulo]/sidebar-state.js"></script>
  
  <!-- ===== FASE 2: Firebase (SIN defer) ===== -->
  <!-- 6. firebase-init.js (PRIMERO - inicializa Firebase) -->
  <script type="module" src="../assets/scripts/firebase-init.js"></script>
  
  <!-- 7. firebase-ready.js (DESPUÉS de firebase-init.js) -->
  <script src="../assets/scripts/firebase-ready.js"></script>
  
  <!-- ===== FASE 3: Scripts con defer (se ejecutan cuando DOM está listo) ===== -->
  <!-- 8. main.js (funciones base) -->
  <script src="../assets/scripts/main.js" defer></script>
  
  <!-- 9. firebase-repo-base.js (ANTES de firebase-repos.js) -->
  <script src="../assets/scripts/firebase-repo-base.js" defer></script>
  
  <!-- 10. firebase-repos.js (DESPUÉS de firebase-repo-base.js) -->
  <script src="../assets/scripts/firebase-repos.js" defer></script>
  
  <!-- 11. Scripts compartidos -->
  <script src="../assets/scripts/shared/event-handlers.js" defer></script>
  
  <!-- 12. Scripts específicos del módulo (con defer) -->
  <script src="../assets/scripts/[modulo]/event-handlers.js" defer></script>
  <script src="../assets/scripts/[modulo]/registros-loader.js" defer></script>
  <!-- ... más scripts del módulo ... -->
  
  <!-- 13. Utilidades y limpieza -->
  <script src="../assets/scripts/localstorage-cleanup.js" defer></script>
</head>
```

## ✅ Estado Final de Correcciones

**TODAS LAS PÁGINAS HAN SIDO CORREGIDAS** ✅

1. ✅ **trafico.html** - CORREGIDO
   - Firebase movido al lugar correcto
   - data-persistence.js reposicionado correctamente
   
2. ✅ **logistica.html** - CORREGIDO
   - Firebase movido al lugar correcto
   - firebase-repos reposicionado correctamente
   
3. ✅ **facturacion.html** - CORREGIDO
   - data-persistence.js movido a la sección de scripts críticos
   
4. ✅ **reportes.html** - CORREGIDO
   - cache-manager.js movido antes de Firebase
   
5. ✅ **Otras páginas** - Ya seguían el patrón correcto

## ✅ Checklist de Verificación

Para cada página HTML, verificar:

- [ ] `auth.js` está ANTES de cualquier script que use permisos
- [ ] `firebase-init.js` está ANTES de `firebase-repo-base.js`
- [ ] `firebase-ready.js` está DESPUÉS de `firebase-init.js`
- [ ] `firebase-repo-base.js` está ANTES de `firebase-repos.js`
- [ ] `cache-manager.js` está sin defer (si se usa)
- [ ] `data-persistence.js` está sin defer (si se guardan datos)
- [ ] Scripts críticos específicos están sin defer (si es necesario)
- [ ] Scripts del módulo están con defer
- [ ] No hay dependencias circulares

