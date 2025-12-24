# 🔧 Limpiar Campo del Formulario

## Problema
Después de limpiar el registro 2500002, el campo del formulario todavía muestra ese valor.

## Solución

Ejecuta este código en la consola (F12):

```javascript
// Limpiar campo del formulario y forzar regeneración
(function() {
    // 1. Limpiar campo numeroRegistro
    const campo = document.getElementById('numeroRegistro');
    if (campo) {
        campo.value = '';
        campo.dispatchEvent(new Event('input', { bubbles: true }));
        campo.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('✅ Campo numeroRegistro limpiado');
    }

    // 2. Limpiar número activo
    localStorage.removeItem('activeRegistrationNumber');
    console.log('✅ Número activo limpiado');

    // 3. Resetear flag de generación
    window.__numeroRegistroGenerado = false;
    console.log('✅ Flag de generación reseteada');

    // 4. Forzar regeneración
    if (typeof window.initializeRegistrationSystem === 'function') {
        window.initializeRegistrationSystem().then(() => {
            console.log('✅ Sistema de numeración reinicializado');
            console.log('🔄 Recarga la página (F5) para ver el nuevo número');
        });
    } else {
        console.log('⚠️ initializeRegistrationSystem no disponible, recarga la página (F5)');
    }
})();
```

## Alternativa: Recargar la Página

La forma más simple es simplemente **recargar la página (F5)**. El sistema debería generar automáticamente `2500001` cuando el campo esté vacío.

















