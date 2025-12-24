# 📋 Template Estándar: Orden de Carga de Scripts

## Orden Estándar para TODOS los HTML

```html
<!-- ===== FASE 0: Bootstrap y Estilos Críticos ===== -->
<!-- Bootstrap JavaScript (requerido para modales) - SIN defer para que cargue inmediatamente -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
<script>
  if (typeof bootstrap === 'undefined') {
    console.error('❌ Bootstrap no se cargó correctamente');
  } else {
    console.log('✅ Bootstrap cargado correctamente');
  }
</script>

<!-- Estilos críticos para ocultar sidebar inicialmente -->
<style>
  /* ... estilos de sidebar ... */
</style>

<!-- ===== FASE 1: Performance y Auth ===== -->
<!-- Performance Optimizations y Loaders Comunes -->
<script src="../assets/scripts/performance/performance-init.js" defer></script>

<!-- CRÍTICO: auth.js DEBE cargarse ANTES de common-head-loader.js -->
<!-- para que los permisos se apliquen antes de que se oculten elementos -->
<script src="../assets/scripts/auth.js"></script>

<!-- Ahora cargar common-head-loader.js que esperará a que auth.js esté listo -->
<script src="../assets/scripts/performance/common-head-loader.js"></script>
<script src="../assets/scripts/script-loader.js" defer></script>

<!-- ===== FASE 2: Scripts Específicos de Página (SIN defer) ===== -->
<!-- Script crítico: Restaurar estado del sidebar ANTES de renderizar para evitar parpadeo -->
<script src="../assets/scripts/menu/sidebar-state.js"></script>
<!-- Script para actualizar período automáticamente -->
<script src="../assets/scripts/periodo.js"></script>

<!-- ===== FASE 3: Scripts Base del Sistema (SIN defer) ===== -->
<!-- CRÍTICO: main.js debe cargarse SIN defer para que funciones base estén disponibles -->
<script src="../assets/scripts/main.js"></script>

<!-- CRÍTICO: cache-manager.js debe cargarse ANTES de otros scripts que usan caché -->
<script src="../assets/scripts/cache-manager.js"></script>

<!-- CRÍTICO: data-persistence.js debe cargarse ANTES de otros scripts que usan persistencia -->
<!-- (Solo para módulos que lo usan: logistica, facturacion, trafico) -->
<script src="../assets/scripts/data-persistence.js"></script>

<!-- ===== FASE 4: Firebase (SIN defer) ===== -->
<!-- CRÍTICO: firebase-init.js debe cargarse PRIMERO para inicializar Firebase -->
<script type="module" src="../assets/scripts/firebase-init.js"></script>
<!-- CRÍTICO: firebase-ready.js debe cargarse DESPUÉS de firebase-init.js para verificar disponibilidad -->
<script src="../assets/scripts/firebase-ready.js"></script>

<!-- ===== FASE 5: Scripts con defer (se ejecutan cuando DOM está listo) ===== -->
<!-- CRÍTICO: firebase-repo-base.js debe cargarse para que FirebaseRepoBase esté disponible -->
<script src="../assets/scripts/firebase-repo-base.js" defer></script>
<!-- CRÍTICO: firebase-repos.js debe cargarse DESPUÉS de firebase-repo-base.js para crear los repositorios -->
<script src="../assets/scripts/firebase-repos.js" defer></script>

<!-- Scripts específicos del módulo (con defer) -->
<script src="../assets/scripts/shared/event-handlers.js" defer></script>
<script src="../assets/scripts/[modulo]/event-handlers.js" defer></script>
<!-- ... otros scripts del módulo con defer ... -->

<!-- Sistema de limpieza automática de localStorage -->
<script src="../assets/scripts/localstorage-cleanup.js" defer></script>
```

## Reglas Importantes

1. **main.js** → SIEMPRE SIN defer
2. **auth.js** → SIEMPRE SIN defer
3. **firebase-init.js** → SIEMPRE type="module" (implícitamente sin defer)
4. **firebase-ready.js** → SIEMPRE SIN defer
5. **cache-manager.js** → SIEMPRE SIN defer
6. **data-persistence.js** → SIN defer (solo si el módulo lo usa)
7. **sidebar-state.js** → SIN defer
8. **periodo.js** → SIN defer
9. **firebase-repo-base.js** → CON defer
10. **firebase-repos.js** → CON defer
11. Scripts del módulo → CON defer
