/**
 * Script INLINE para ocultar módulos ANTES de cualquier renderizado
 * Este archivo se puede incluir en el <head> de todas las páginas
 * para evitar el parpadeo donde se muestran todos los módulos primero
 */

(function () {
  'use strict';

  const moduleIds = [
    'nav-logistica',
    'nav-facturacion',
    'nav-trafico',
    'nav-operadores',
    'nav-diesel',
    'nav-mantenimiento',
    'nav-tesoreria',
    'nav-cxc',
    'nav-cxp',
    'nav-inventario',
    'nav-configuracion',
    'nav-reportes',
    'nav-dashboard'
  ];

  function hideModulesNow() {
    moduleIds.forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.classList.contains('permission-granted')) {
        // Usar múltiples propiedades para asegurar ocultación completa
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.style.setProperty('opacity', '0', 'important');
        el.style.setProperty('height', '0', 'important');
        el.style.setProperty('overflow', 'hidden', 'important');
      }
    });
  }

  // Ejecutar inmediatamente
  hideModulesNow();

  // También cuando el DOM esté disponible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideModulesNow, { once: true });
  }

  // Ejecutar múltiples veces con delays mínimos para asegurar
  setTimeout(hideModulesNow, 0);
  setTimeout(hideModulesNow, 1);
  setTimeout(hideModulesNow, 5);
  setTimeout(hideModulesNow, 10);
  setTimeout(hideModulesNow, 50);
})();

