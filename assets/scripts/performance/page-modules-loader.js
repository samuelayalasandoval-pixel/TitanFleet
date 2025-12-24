/**
 * Cargador Genérico de Módulos por Página
 * Carga automáticamente los módulos según la página actual
 * Reduce código HTML duplicado
 */

(function () {
  'use strict';

  /**
   * Detecta el nombre de la página actual desde la URL
   */
  function getCurrentPageName() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || path.split('\\').pop();
    const pageName = filename.replace('.html', '').toLowerCase();

    // Mapear nombres de archivos a nombres de configuración
    const nameMap = {
      cxc: 'cxc',
      cxp: 'cxp'
    };

    return nameMap[pageName] || pageName;
  }

  /**
   * Carga módulos de una página específica
   */
  async function loadPageModules(pageName) {
    // Esperar a que las optimizaciones estén listas
    await new Promise(resolve => {
      if (window.PerformanceOptimizationsLoaded) {
        resolve();
      } else {
        window.addEventListener('performanceOptimizationsReady', resolve, { once: true });
        setTimeout(resolve, 2000);
      }
    });

    // Obtener configuración de módulos
    const config = window.PageModulesConfig?.[pageName];
    if (!config) {
      console.warn(`⚠️ No hay configuración de módulos para la página: ${pageName}`);
      return;
    }

    try {
      // Cargar módulos específicos de la página primero (si existen)
      // Estos se cargan de forma tradicional con defer para no bloquear
      if (config.pageSpecific && config.pageSpecific.length > 0) {
        config.pageSpecific.forEach(src => {
          // Si es una URL externa (CDN), cargar directamente
          if (src.startsWith('http://') || src.startsWith('https://')) {
            const script = document.createElement('script');
            script.src = src;
            script.defer = true;
            document.head.appendChild(script);
          } else {
            // Convertir ruta relativa a absoluta si es necesario
            let absoluteSrc = src;
            if (src.startsWith('../')) {
              absoluteSrc = src.replace('../', '/');
            } else if (!src.startsWith('/') && !src.startsWith('http')) {
              absoluteSrc = `/assets/scripts/${src}`;
            }

            if (window.ScriptLoader) {
              // Para scripts locales, usar ScriptLoader si está disponible
              window.ScriptLoader.load(absoluteSrc).catch(err => {
                console.warn(`Error cargando ${absoluteSrc}:`, err);
                // Fallback: carga tradicional
                const script = document.createElement('script');
                script.src = absoluteSrc;
                script.defer = true;
                document.head.appendChild(script);
              });
            } else {
              // Fallback: carga tradicional
              const script = document.createElement('script');
              script.src = absoluteSrc;
              script.defer = true;
              document.head.appendChild(script);
            }
          }
        });
      }

      // Cargar módulos críticos
      if (config.critical && config.critical.length > 0) {
        const criticalPaths = config.critical.map(src => {
          if (src.startsWith('../')) {
            return src.replace('../', '/');
          } else if (!src.startsWith('/') && !src.startsWith('http')) {
            return `/assets/scripts/${src}`;
          }
          return src;
        });

        if (window.ScriptLoader) {
          await window.ScriptLoader.loadMultiple(criticalPaths);
          // console.log(`✅ Módulos críticos de ${pageName} cargados`);
        } else {
          criticalPaths.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            script.defer = true;
            document.head.appendChild(script);
          });
        }
      }

      // Cargar módulos secundarios después de un pequeño delay
      if (config.secondary && config.secondary.length > 0) {
        setTimeout(async () => {
          const secondaryPaths = config.secondary.map(src => {
            if (src.startsWith('../')) {
              return src.replace('../', '/');
            } else if (!src.startsWith('/') && !src.startsWith('http')) {
              return `/assets/scripts/${src}`;
            }
            return src;
          });

          if (window.ScriptLoader) {
            await window.ScriptLoader.loadMultiple(secondaryPaths);
            // console.log(`✅ Módulos secundarios de ${pageName} cargados`);
          } else {
            secondaryPaths.forEach(src => {
              const script = document.createElement('script');
              script.src = src;
              script.defer = true;
              document.head.appendChild(script);
            });
          }
        }, 100);
      }

      // Los módulos opcionales se cargan bajo demanda cuando se necesiten
      // No se cargan automáticamente para no afectar el rendimiento
    } catch (error) {
      console.error(`❌ Error cargando módulos de ${pageName}:`, error);
    }
  }

  /**
   * Inicializa la carga de módulos cuando el DOM esté listo
   */
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        const pageName = getCurrentPageName();
        loadPageModules(pageName);
      });
    } else {
      const pageName = getCurrentPageName();
      loadPageModules(pageName);
    }
  }

  // Inicializar
  init();

  // Exponer función para uso manual si es necesario
  window.loadPageModules = loadPageModules;
  window.getCurrentPageName = getCurrentPageName;
})();
