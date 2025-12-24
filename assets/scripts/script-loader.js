// ===== SISTEMA DE CARGA DINÁMICA DE SCRIPTS (LAZY LOADING) =====
/**
 * ScriptLoader - Sistema para cargar scripts bajo demanda
 * Mejora el rendimiento cargando solo los scripts esenciales al inicio
 * y cargando módulos adicionales cuando se necesitan
 */

(function () {
  'use strict';

  // Cache de scripts ya cargados
  const loadedScripts = new Set();
  const loadingPromises = new Map();

  /**
   * Carga un script de forma asíncrona
   * @param {string} src - Ruta del script
   * @param {Object} options - Opciones de carga
   * @returns {Promise} - Promesa que se resuelve cuando el script está cargado
   */
  function loadScript(src, options = {}) {
    // Si ya está cargado, retornar promesa resuelta
    if (loadedScripts.has(src)) {
      return Promise.resolve();
    }

    // Si ya está en proceso de carga, retornar la promesa existente
    if (loadingPromises.has(src)) {
      return loadingPromises.get(src);
    }

    // Crear nueva promesa de carga
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = options.async !== false;
      script.defer = options.defer || false;

      if (options.type) {
        script.type = options.type;
      }

      script.onload = () => {
        loadedScripts.add(src);
        loadingPromises.delete(src);
        // console.log(`✅ Script cargado: ${src}`);
        resolve();
      };

      script.onerror = () => {
        loadingPromises.delete(src);
        console.error(`❌ Error cargando script: ${src}`);
        reject(new Error(`Error cargando script: ${src}`));
      };

      document.head.appendChild(script);
    });

    loadingPromises.set(src, promise);
    return promise;
  }

  /**
   * Carga múltiples scripts en paralelo
   * @param {string[]} scripts - Array de rutas de scripts
   * @returns {Promise} - Promesa que se resuelve cuando todos los scripts están cargados
   */
  function loadScripts(scripts) {
    return Promise.all(scripts.map(src => loadScript(src)));
  }

  /**
   * Carga scripts en secuencia (uno después del otro)
   * @param {string[]} scripts - Array de rutas de scripts
   * @returns {Promise} - Promesa que se resuelve cuando todos los scripts están cargados
   */
  function loadScriptsSequential(scripts) {
    return scripts.reduce((promise, src) => promise.then(() => loadScript(src)), Promise.resolve());
  }

  /**
   * Verifica si un script ya está cargado
   * @param {string} src - Ruta del script
   * @returns {boolean}
   */
  function isScriptLoaded(src) {
    return loadedScripts.has(src);
  }

  /**
   * Carga un módulo bajo demanda cuando se detecta su uso
   * @param {string} moduleName - Nombre del módulo
   * @param {string|string[]} scripts - Script(s) del módulo
   * @param {Function} callback - Función a ejecutar después de cargar
   */
  function loadModuleOnDemand(moduleName, scripts, callback) {
    const scriptArray = Array.isArray(scripts) ? scripts : [scripts];

    // Verificar si ya están cargados
    const allLoaded = scriptArray.every(src => isScriptLoaded(src));
    if (allLoaded && callback) {
      callback();
      return Promise.resolve();
    }

    console.log(`📦 Cargando módulo bajo demanda: ${moduleName}`);
    return loadScripts(scriptArray)
      .then(() => {
        if (callback) {
          callback();
        }
      })
      .catch(error => {
        console.error(`❌ Error cargando módulo ${moduleName}:`, error);
        throw error;
      });
  }

  // Exportar API pública
  window.ScriptLoader = {
    load: loadScript,
    loadMultiple: loadScripts,
    loadSequential: loadScriptsSequential,
    loadModule: loadModuleOnDemand,
    isLoaded: isScriptLoaded,
    getLoadedScripts: () => Array.from(loadedScripts)
  };

  console.log('✅ ScriptLoader inicializado');
})();
