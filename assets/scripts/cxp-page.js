// ===== SCRIPTS ESPECÍFICOS DE LA PÁGINA CXP =====

// Función temporal que se reemplazará cuando se cargue cxp.js
(function () {
  'use strict';

  if (typeof window.abrirModalNuevaFactura === 'undefined') {
    let checkInterval = null;
    let isChecking = false;
    let hasExecuted = false;
    const FUNCTION_MARKER = '__CXP_MODAL_FUNCTION_READY__';

    window.abrirModalNuevaFactura = function () {
      // Verificar si la función completa ya está disponible
      const funcStr = window.abrirModalNuevaFactura.toString();
      const isCompleteFunction = funcStr.includes('🔓 abrirModalNuevaFactura llamada');

      if (isCompleteFunction || window[FUNCTION_MARKER] === true) {
        // La función completa está lista, ejecutarla directamente
        if (hasExecuted) {
          console.log('⏳ Función ya ejecutada en esta llamada, ignorando...');
          return;
        }

        hasExecuted = true;
        setTimeout(() => {
          hasExecuted = false;
        }, 1000); // Reset después de 1 segundo

        try {
          const form = document.getElementById('formNuevaFactura');
          const modalElement = document.getElementById('modalNuevaFactura');

          if (form && modalElement && typeof bootstrap !== 'undefined') {
            // Llamar a la función completa (ya está reemplazada)
            window.abrirModalNuevaFactura.call(this);
          } else {
            console.warn('⚠️ Elementos del modal aún no disponibles');
            hasExecuted = false;
          }
        } catch (error) {
          console.error('❌ Error ejecutando función completa:', error);
          hasExecuted = false;
          alert('Error al abrir el modal. Por favor, recarga la página.');
        }
        return;
      }

      // Si ya estamos verificando, no hacer nada
      if (isChecking) {
        return;
      }

      // Esperar a que el script se cargue
      isChecking = true;
      let attempts = 0;
      const maxAttempts = 20;

      checkInterval = setInterval(() => {
        attempts++;

        // Verificar si la función completa está disponible
        const currentFuncStr = window.abrirModalNuevaFactura.toString();
        const isComplete =
          currentFuncStr.includes('🔓 abrirModalNuevaFactura llamada') ||
          window[FUNCTION_MARKER] === true;

        if (isComplete) {
          clearInterval(checkInterval);
          isChecking = false;

          // Ejecutar la función completa una sola vez
          if (!hasExecuted) {
            hasExecuted = true;
            setTimeout(() => {
              hasExecuted = false;
            }, 1000);

            try {
              const form = document.getElementById('formNuevaFactura');
              const modalElement = document.getElementById('modalNuevaFactura');
              if (form && modalElement) {
                // Llamar a la función completa (ya está reemplazada)
                window.abrirModalNuevaFactura();
              } else {
                console.warn('⚠️ Elementos del modal aún no disponibles');
                hasExecuted = false;
              }
            } catch (error) {
              console.error('❌ Error ejecutando función completa:', error);
              hasExecuted = false;
              alert('Error al abrir el modal. Por favor, recarga la página.');
            }
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          isChecking = false;
          console.error(`❌ cxp.js no se cargó después de ${maxAttempts * 0.5} segundos`);
          alert(
            'Error: El sistema aún se está cargando. Por favor, espera unos segundos e intenta nuevamente.'
          );
        }
      }, 500);
    };
  }
})();

// Script crítico: Restaurar estado del sidebar ANTES de renderizar para evitar parpadeo
(function () {
  'use strict';
  // Leer estado del sidebar inmediatamente
  try {
    const savedState = localStorage.getItem('sidebarCollapsed');
    // Función para aplicar clases inmediatamente cuando el DOM esté disponible
    function applySidebarState() {
      const sidebar = document.getElementById('sidebar');
      const mainContent = document.getElementById('mainContent');
      if (sidebar && mainContent) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('sidebar-collapsed');
        return true;
      }
      return false;
    }

    if (savedState === 'true') {
      // Aplicar estilo inline directamente al body para que se ejecute antes del render
      document.documentElement.style.setProperty('--sidebar-initial-state', 'collapsed');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        if (sidebar && mainContent) {
          sidebar.classList.add('collapsed');
          mainContent.classList.add('sidebar-collapsed');
          return true;
        }
        return false;
      }

      // Intentar aplicar inmediatamente si el DOM ya está disponible
      if (document.body) {
        applySidebarState();
      } else {
        // Si el body aún no existe, usar MutationObserver para detectar cuando se crea
        const observer = new MutationObserver(_mutations => {
          if (document.getElementById('sidebar') && document.getElementById('mainContent')) {
            applySidebarState();
            observer.disconnect();
          }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });

        // También intentar en DOMContentLoaded como fallback
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            setTimeout(applySidebarState, 0);
          });
        }
      }
    }
  } catch (e) {
    // Silenciar errores si localStorage no está disponible
  }
})();

// ===== SISTEMA DE CARGA BAJO DEMANDA (LAZY LOADING) =====
(function () {
  'use strict';

  // Detectar la ruta base automáticamente basándose en la ubicación de la página
  let basePath = 'assets/scripts/'; // Por defecto desde raíz
  try {
    const { pathname } = window.location;
    // Si estamos en pages/, necesitamos subir un nivel
    if (pathname.includes('/pages/')) {
      basePath = '../assets/scripts/';
    } else {
      basePath = 'assets/scripts/';
    }
  } catch (e) {
    // Si falla, usar la ruta por defecto
    console.warn('No se pudo determinar la ruta base, usando ruta por defecto');
    basePath = '../assets/scripts/'; // Asumir que estamos en pages/
  }

  const MODULES_CONFIG = {
    print: {
      scripts: [`${basePath}print-pdf.js`],
      loaded: false
    },
    config: {
      scripts: [`${basePath}configuracion.js`],
      loaded: false
    },
    connection: {
      scripts: [`${basePath}connection-monitor.js`],
      loaded: false
    },
    integration: {
      scripts: [`${basePath}integration.js`],
      loaded: false
    },
    firebaseForce: {
      scripts: [`${basePath}firebase-force.js`],
      loaded: false
    }
  };

  window.loadModule = function (moduleName) {
    if (!window.ScriptLoader) {
      console.error('❌ ScriptLoader no está disponible');
      return Promise.reject(new Error('ScriptLoader no disponible'));
    }
    const module = MODULES_CONFIG[moduleName];
    if (!module) {
      console.error(`❌ Módulo desconocido: ${moduleName}`);
      return Promise.reject(new Error(`Módulo desconocido: ${moduleName}`));
    }
    if (module.loaded) {
      return Promise.resolve();
    }
    console.log(`📦 Cargando módulo: ${moduleName}`);
    return window.ScriptLoader.loadMultiple(module.scripts)
      .then(() => {
        module.loaded = true;
        console.log(`✅ Módulo cargado: ${moduleName}`);
        window.dispatchEvent(new CustomEvent('moduleLoaded', { detail: { module: moduleName } }));
      })
      .catch(error => {
        console.error(`❌ Error cargando módulo ${moduleName}:`, error);
        throw error;
      });
  };

  window.loadModules = function (moduleNames) {
    // Validar que moduleNames sea un array válido
    if (!moduleNames || !Array.isArray(moduleNames)) {
      console.warn('⚠️ loadModules: moduleNames no es un array válido:', moduleNames);
      return Promise.resolve([]);
    }
    return Promise.all(moduleNames.map(name => window.loadModule(name)));
  };

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      window
        .loadModule('connection')
        .catch(err => console.warn('No se pudo cargar módulo connection:', err));
    }, 1000);
    if ('requestIdleCallback' in window) {
      requestIdleCallback(
        () => {
          const modulesToPreload = ['integration'];
          modulesToPreload.forEach(moduleName => {
            if (!MODULES_CONFIG[moduleName].loaded) {
              window.loadModule(moduleName).catch(() => {});
            }
          });
        },
        { timeout: 3000 }
      );
    } else {
      setTimeout(() => {
        window.loadModule('integration').catch(() => {});
      }, 3000);
    }
  });
})();
