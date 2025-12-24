/**
 * Configuración de Módulos Lazy Loading - trafico.html
 * Sistema de carga bajo demanda de módulos JavaScript
 */

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

  // Configuración de módulos para carga bajo demanda
  window.MODULES_CONFIG = {
    // Módulo de impresión PDF
    print: {
      scripts: [`${basePath}print-pdf.js`],
      loaded: false
    },
    // Módulo de configuración
    config: {
      scripts: [`${basePath}configuracion.js`],
      loaded: false
    },
    // Módulo de listas de tráfico
    listas: {
      scripts: [`${basePath}trafico-listas.js`],
      loaded: false
    },
    // Módulo de gastos de operadores
    gastos: {
      scripts: [`${basePath}trafico-gastos-operadores.js`],
      loaded: false
    },
    // Módulo de sincronización
    sync: {
      scripts: [
        `${basePath}sincronizacion.js`,
        `${basePath}sync-config-to-firebase.js`,
        `${basePath}sync-manager.js`,
        `${basePath}sync-verifier.js`
      ],
      loaded: false
    },
    // Módulo de conexión y monitoreo
    connection: {
      scripts: [`${basePath}connection-monitor.js`, `${basePath}error-handler-panel.js`],
      loaded: false
    },
    // Módulo de integración
    integration: {
      scripts: [`${basePath}integration.js`],
      loaded: false
    },
    // Módulo de Firebase Force
    firebaseForce: {
      scripts: [`${basePath}firebase-force.js`],
      loaded: false
    }
  };

  /**
   * Carga un módulo bajo demanda
   * @param {string} moduleName - Nombre del módulo
   * @returns {Promise}
   */
  window.loadModule = function (moduleName) {
    if (!window.ScriptLoader) {
      console.error('❌ ScriptLoader no está disponible');
      return Promise.reject(new Error('ScriptLoader no disponible'));
    }

    const module = window.MODULES_CONFIG[moduleName];
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

  /**
   * Carga múltiples módulos en paralelo
   * @param {string[]} moduleNames - Array de nombres de módulos
   * @returns {Promise}
   */
  window.loadModules = function (moduleNames) {
    if (!moduleNames || !Array.isArray(moduleNames)) {
      // Si se llama sin parámetros, probablemente es una llamada incorrecta desde firebase-init.js
      // No mostrar warning si estamos en una página que no es menú (donde loadModules no debería llamarse sin parámetros)
      const pathname = window.location.pathname || '';
      const filename = pathname.split('/').pop() || pathname.split('\\').pop() || '';
      const isMenuPage = filename === 'menu.html' || filename === '' || filename === 'index.html';

      // Solo mostrar warning si no estamos en la página de menú
      // (en la página de menú, la función loadModules del menú debería estar activa)
      if (!isMenuPage) {
        // Silenciar el warning ya que firebase-init.js puede llamar esto por error
        // pero no es crítico
        console.debug(
          'ℹ️ loadModules: moduleNames no es un array válido (llamada sin parámetros en página no-menú)'
        );
      }
      return Promise.resolve([]);
    }
    return Promise.all(moduleNames.map(name => window.loadModule(name)));
  };

  // Cargar módulos críticos después de que la página esté lista
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      window
        .loadModule('connection')
        .catch(err => console.warn('No se pudo cargar módulo connection:', err));
    }, 1000);

    // Precarga inteligente
    if ('requestIdleCallback' in window) {
      requestIdleCallback(
        () => {
          const modulesToPreload = ['integration'];
          modulesToPreload.forEach(moduleName => {
            if (!window.MODULES_CONFIG[moduleName].loaded) {
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

  // Interceptar llamadas a funciones que requieren módulos específicos
  (function () {
    // Interceptar funciones de gastos de operadores
    const gastosFunctions = [
      'agregarGastoOperador',
      'eliminarGastoOperador',
      'limpiarGastosOperadores',
      'agregarGastoOperadorModal',
      'eliminarGastoOperadorModal',
      'desplegarListaOperadoresGastos'
    ];
    gastosFunctions.forEach(funcName => {
      const originalFunc = window[funcName];
      window[funcName] = function () {
        if (window.MODULES_CONFIG.gastos.loaded && originalFunc) {
          return originalFunc.apply(this, arguments);
        }
        return window
          .loadModule('gastos')
          .then(() => {
            const loadedFunc = window[funcName];
            if (loadedFunc) {
              return loadedFunc.apply(this, arguments);
            }
          })
          .catch(err => {
            console.error(`Error ejecutando ${funcName}:`, err);
          });
      };
    });

    // Interceptar funciones de impresión PDF
    const printFunctions = ['printPage', 'printTrafico', 'imprimirTrafico'];
    printFunctions.forEach(funcName => {
      if (window[funcName]) {
        const originalFunc = window[funcName];
        window[funcName] = function () {
          if (window.MODULES_CONFIG.print.loaded && originalFunc) {
            return originalFunc.apply(this, arguments);
          }
          return window.loadModule('print').then(() => {
            const loadedFunc = window[funcName];
            if (loadedFunc) {
              return loadedFunc.apply(this, arguments);
            }
          });
        };
      }
    });
  })();

  // Sistema de detección automática de necesidades de módulos
  document.addEventListener('DOMContentLoaded', () => {
    // Cargar módulo de gastos cuando se hace clic en sección de gastos
    const gastosSection = document.querySelector('[id*="gasto"], [class*="gasto"]');
    if (gastosSection) {
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const { target } = mutation;
            if (target.classList.contains('show') || target.style.display !== 'none') {
              window.loadModule('gastos').catch(() => {});
            }
          }
        });
      });

      if (gastosSection) {
        observer.observe(gastosSection, { attributes: true, attributeFilter: ['class', 'style'] });
      }
    }

    // Cargar módulo de gastos automáticamente si hay campos de gastos en la página
    const gastosInputs = document.querySelectorAll('[id*="gasto"], [id*="Gasto"]');
    if (gastosInputs.length > 0) {
      console.log('📦 Detectados campos de gastos, cargando módulo automáticamente...');
      window.loadModule('gastos').catch(err => {
        console.warn('⚠️ Error cargando módulo de gastos:', err);
      });
    }

    // También precargar cuando el usuario interactúa con campos relacionados
    gastosInputs.forEach(input => {
      input.addEventListener(
        'focus',
        () => {
          window.loadModule('gastos').catch(() => {});
        },
        { once: true }
      );
    });

    // Precargar módulo de listas cuando se necesite
    const listasButtons = document.querySelectorAll('[onclick*="lista"], [onclick*="Lista"]');
    listasButtons.forEach(button => {
      button.addEventListener(
        'click',
        () => {
          window.loadModule('listas').catch(() => {});
        },
        { once: true }
      );
    });

    // Precargar módulo de sincronización cuando se detecte actividad de sync
    if (window.SyncManager || document.querySelector('[id*="sync"], [class*="sync"]')) {
      setTimeout(() => {
        window.loadModule('sync').catch(() => {});
      }, 2000);
    }
  });
})();
