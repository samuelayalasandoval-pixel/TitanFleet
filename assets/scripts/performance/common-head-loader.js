/**
 * Cargador de Recursos Comunes en el Head
 * Agrega preloads y recursos comunes al head de forma automática
 * Reduce código HTML duplicado
 */

(function () {
  'use strict';

  // ============================================
  // CRÍTICO: Ocultar módulos ANTES de renderizar
  // ============================================
  // Este código debe ejecutarse LO MÁS TEMPRANO POSIBLE
  // para evitar que se vean todos los módulos antes de aplicar permisos
  (function () {
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

    function hideAll() {
      moduleIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) {
          return;
        }

        // CRÍTICO: NO ocultar si ya tiene la clase permission-granted
        // Esta clase se agrega cuando applyNavigationPermissions() muestra el elemento
        if (el.classList.contains('permission-granted')) {
          return; // No tocar elementos que ya tienen permisos
        }

        // Verificar si el elemento ya está visible (fue mostrado por applyNavigationPermissions)
        const computedDisplay = window.getComputedStyle(el).display;

        // Si el elemento ya está visible (list-item o block), NO ocultarlo
        // applyNavigationPermissions() ya lo mostró, respetar eso
        if (computedDisplay === 'list-item' || computedDisplay === 'block') {
          // El elemento ya está visible, probablemente tiene permisos
          // Verificar permisos antes de ocultar
          if (
            typeof window.erpAuth !== 'undefined' &&
            typeof window.erpAuth.canAccessModule === 'function'
          ) {
            const idToModuleMap = {
              'nav-logistica': 'Logística',
              'nav-facturacion': 'Facturación',
              'nav-trafico': 'Tráfico',
              'nav-operadores': 'Operadores',
              'nav-diesel': 'Diesel',
              'nav-mantenimiento': 'Mantenimiento',
              'nav-tesoreria': 'Tesoreria',
              'nav-cxc': 'Cuentas x Cobrar',
              'nav-cxp': 'Cuentas x Pagar',
              'nav-inventario': 'Inventario',
              'nav-configuracion': 'Configuración',
              'nav-reportes': 'Reportes'
            };

            const moduleName = idToModuleMap[id];
            if (moduleName && window.erpAuth.canAccessModule(moduleName)) {
              // El usuario tiene permisos, NO ocultar y marcar como granted
              el.classList.add('permission-granted');
              return; // No ocultar este elemento
            }
          } else {
            // Si erpAuth no está disponible pero el elemento está visible,
            // asumir que applyNavigationPermissions() lo mostró y NO ocultarlo
            el.classList.add('permission-granted');
            return; // No ocultar este elemento
          }
        }

        // Verificar si el usuario tiene permisos para este módulo ANTES de ocultar
        // Si erpAuth está disponible, verificar permisos primero
        if (
          typeof window.erpAuth !== 'undefined' &&
          typeof window.erpAuth.canAccessModule === 'function'
        ) {
          // Mapear ID a nombre de módulo
          const idToModuleMap = {
            'nav-logistica': 'Logística',
            'nav-facturacion': 'Facturación',
            'nav-trafico': 'Tráfico',
            'nav-operadores': 'Operadores',
            'nav-diesel': 'Diesel',
            'nav-mantenimiento': 'Mantenimiento',
            'nav-tesoreria': 'Tesoreria',
            'nav-cxc': 'Cuentas x Cobrar',
            'nav-cxp': 'Cuentas x Pagar',
            'nav-inventario': 'Inventario',
            'nav-configuracion': 'Configuración',
            'nav-reportes': 'Reportes'
          };

          const moduleName = idToModuleMap[id];
          if (moduleName && window.erpAuth.canAccessModule(moduleName)) {
            // El usuario tiene permisos, NO ocultar
            el.classList.add('permission-granted');
            return; // No ocultar este elemento
          }
        }

        // Si no tiene permisos o erpAuth no está disponible, ocultar
        // PERO solo si no está ya visible (evitar ocultar elementos que ya fueron mostrados)
        if (computedDisplay !== 'list-item' && computedDisplay !== 'block') {
          el.style.setProperty('display', 'none', 'important');
          el.style.setProperty('visibility', 'hidden', 'important');
          el.style.setProperty('opacity', '0', 'important');
          el.style.setProperty('height', '0', 'important');
          el.style.setProperty('overflow', 'hidden', 'important');
        }
      });
    }

    // Función mejorada que espera a auth.js si está disponible
    function hideAllWithPermissions() {
      // Si auth.js está disponible, aplicar permisos PRIMERO
      if (
        typeof window.erpAuth !== 'undefined' &&
        typeof window.erpAuth.canAccessModule === 'function'
      ) {
        // Aplicar permisos primero ANTES de ocultar (solo si no se han aplicado ya)
        if (!permissionsApplied && typeof window.applyNavigationPermissions === 'function') {
          window.applyNavigationPermissions();
          permissionsApplied = true;
        }
        // Luego ocultar SOLO los que no tienen permisos (y no tienen la clase permission-granted)
        hideAll();
      } else {
        // Si auth.js no está disponible aún, ocultar todos temporalmente
        // PERO solo si no tienen la clase permission-granted
        hideAll();
      }
    }

    // NO ejecutar hideAll() inmediatamente si auth.js está disponible
    // Esperar a que auth.js aplique permisos primero
    // Intentar aplicar permisos primero, luego ocultar
    let permissionsApplied = false;
    function tryApplyThenHide() {
      // Si los permisos ya se aplicaron, solo ocultar los que no tienen permisos
      // pero NO tocar elementos que ya están visibles
      if (permissionsApplied) {
        hideAll();
        return;
      }

      if (
        typeof window.erpAuth !== 'undefined' &&
        typeof window.applyNavigationPermissions === 'function'
      ) {
        // auth.js está disponible, aplicar permisos primero
        window.applyNavigationPermissions();
        permissionsApplied = true;
        // Luego ocultar los que no tienen permisos (después de un pequeño delay)
        setTimeout(hideAll, 50);
      } else {
        // auth.js no está disponible aún, ocultar todos temporalmente
        // PERO solo si no tienen la clase permission-granted
        hideAll();
      }
    }

    // Intentar aplicar permisos primero
    tryApplyThenHide();

    // También cuando el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener(
        'DOMContentLoaded',
        () => {
          hideAllWithPermissions();
        },
        { once: true }
      );
    } else {
      hideAllWithPermissions();
    }

    // Múltiples intentos con delays para que auth.js tenga tiempo de cargarse
    // PERO siempre aplicar permisos PRIMERO antes de ocultar
    setTimeout(() => {
      if (typeof window.applyNavigationPermissions === 'function') {
        window.applyNavigationPermissions();
      }
      hideAll();
    }, 100);
    setTimeout(() => {
      if (typeof window.applyNavigationPermissions === 'function') {
        window.applyNavigationPermissions();
      }
      hideAll();
    }, 200);
    setTimeout(() => {
      if (typeof window.applyNavigationPermissions === 'function') {
        window.applyNavigationPermissions();
      }
      hideAll();
    }, 500);
    setTimeout(() => {
      if (typeof window.applyNavigationPermissions === 'function') {
        window.applyNavigationPermissions();
      }
      hideAll();
    }, 1000);
  })();

  /**
   * Ocultar módulos del sidebar inmediatamente para evitar parpadeo
   * Esto se ejecuta ANTES de que cualquier otro script se cargue
   * CRÍTICO: Debe ejecutarse lo más temprano posible
   */
  function hideModulesImmediately() {
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

    moduleIds.forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.classList.contains('permission-granted')) {
        // Verificar permisos antes de ocultar
        if (
          typeof window.erpAuth !== 'undefined' &&
          typeof window.erpAuth.canAccessModule === 'function'
        ) {
          const idToModuleMap = {
            'nav-logistica': 'Logística',
            'nav-facturacion': 'Facturación',
            'nav-trafico': 'Tráfico',
            'nav-operadores': 'Operadores',
            'nav-diesel': 'Diesel',
            'nav-mantenimiento': 'Mantenimiento',
            'nav-tesoreria': 'Tesoreria',
            'nav-cxc': 'Cuentas x Cobrar',
            'nav-cxp': 'Cuentas x Pagar',
            'nav-inventario': 'Inventario',
            'nav-configuracion': 'Configuración',
            'nav-reportes': 'Reportes'
          };

          const moduleName = idToModuleMap[id];
          if (moduleName && window.erpAuth.canAccessModule(moduleName)) {
            // El usuario tiene permisos, NO ocultar
            el.classList.add('permission-granted');
            return; // No ocultar este elemento
          }
        }

        // Si no tiene permisos, ocultar
        el.style.setProperty('display', 'none', 'important');
      }
    });
  }

  // NO ejecutar inmediatamente si auth.js está disponible
  // Esperar a que auth.js aplique permisos primero
  if (
    typeof window.erpAuth !== 'undefined' &&
    typeof window.applyNavigationPermissions === 'function'
  ) {
    // auth.js está disponible, aplicar permisos primero
    window.applyNavigationPermissions();
    // Luego ocultar los que no tienen permisos
    setTimeout(hideModulesImmediately, 50);
  } else {
    // auth.js no está disponible aún, ocultar todos temporalmente
    hideModulesImmediately();
  }

  // También ejecutar cuando el DOM esté disponible
  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        if (typeof window.applyNavigationPermissions === 'function') {
          window.applyNavigationPermissions();
        }
        hideModulesImmediately();
      },
      { once: true }
    );
  } else {
    if (typeof window.applyNavigationPermissions === 'function') {
      window.applyNavigationPermissions();
    }
    hideModulesImmediately();
  }

  // Ejecutar después de micro-delays para asegurar
  // PERO siempre aplicar permisos PRIMERO
  setTimeout(() => {
    if (typeof window.applyNavigationPermissions === 'function') {
      window.applyNavigationPermissions();
    }
    hideModulesImmediately();
  }, 0);
  setTimeout(() => {
    if (typeof window.applyNavigationPermissions === 'function') {
      window.applyNavigationPermissions();
    }
    hideModulesImmediately();
  }, 10);
  setTimeout(() => {
    if (typeof window.applyNavigationPermissions === 'function') {
      window.applyNavigationPermissions();
    }
    hideModulesImmediately();
  }, 50);

  /**
   * Agrega preloads comunes
   * Solo precarga recursos que NO están ya cargados como stylesheet
   */
  function addCommonPreloads() {
    const preloads = [
      {
        href: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css',
        as: 'style'
      },
      {
        href: '../styles/styles.css',
        as: 'style'
      }
    ];

    preloads.forEach(preload => {
      // Verificar si ya existe como preload
      const existingPreload = document.querySelector(`link[rel="preload"][href="${preload.href}"]`);
      if (existingPreload) {
        return;
      }

      // Verificar si ya existe como stylesheet (ya está cargado)
      const existingStylesheet = document.querySelector(
        `link[rel="stylesheet"][href="${preload.href}"]`
      );
      if (existingStylesheet) {
        // No precargar si ya está cargado como stylesheet
        return;
      }

      // Solo precargar si no está cargado
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = preload.href;
      link.as = preload.as;
      // Convertir a stylesheet después de cargar para evitar advertencias
      link.onload = function () {
        this.rel = 'stylesheet';
      };
      document.head.insertBefore(link, document.head.firstChild);
    });
  }

  /**
   * Configura SheetJS para carga bajo demanda
   */
  function setupSheetJSLoader() {
    if (window.loadSheetJS) {
      return;
    } // Ya está configurado

    window.loadSheetJS = function () {
      return new Promise((resolve, reject) => {
        if (window.XLSX) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.19.3/dist/xlsx.full.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Error cargando SheetJS'));
        document.head.appendChild(script);
      });
    };
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      addCommonPreloads();
      setupSheetJSLoader();
    });
  } else {
    addCommonPreloads();
    setupSheetJSLoader();
  }
})();
