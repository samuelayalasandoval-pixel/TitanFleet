/**
 * Performance Init - Inicializador de optimizaciones de rendimiento
 * Integra todas las optimizaciones: Code Splitting, Firebase Query Optimization, Initial Load
 */

(function () {
  'use strict';

  // Verificar si las optimizaciones ya están cargadas
  if (window.PerformanceOptimizationsLoaded) {
    return;
  }

  // Marcar como cargado
  window.PerformanceOptimizationsLoaded = true;

  // Configuración de optimizaciones
  const config = {
    enableCodeSplitting: true,
    enableQueryOptimization: true,
    enableInitialLoadOptimization: true,
    debugMode: window.DEBUG_PERFORMANCE || false
  };

  /**
   * Inicializa todas las optimizaciones
   */
  async function initPerformanceOptimizations() {
    const startTime = performance.now();

    try {
      // 1. Cargar optimizador de consultas Firebase
      if (config.enableQueryOptimization) {
        if (!window.FirebaseQueryOptimizer) {
          await loadScript('/assets/scripts/performance/firebase-query-optimizer.js');
        }
        console.log('✅ Firebase Query Optimizer cargado');
      }

      // 2. Cargar optimizador de carga inicial
      if (config.enableInitialLoadOptimization) {
        if (!window.InitialLoadOptimizer) {
          await loadScript('/assets/scripts/performance/initial-load-optimizer.js');
        }
        console.log('✅ Initial Load Optimizer cargado');
      }

      // 3. Cargar code split loader
      if (config.enableCodeSplitting) {
        if (!window.CodeSplitLoader) {
          await loadScript('/assets/scripts/performance/code-split-loader.js');
        }
        console.log('✅ Code Split Loader cargado');
      }

      // 4. Configurar recursos críticos
      if (window.InitialLoadOptimizer) {
        setupCriticalResources();
      }

      const loadTime = performance.now() - startTime;
      if (config.debugMode) {
        console.log(`✅ Optimizaciones de rendimiento inicializadas en ${loadTime.toFixed(2)}ms`);
      }

      // Disparar evento de optimizaciones listas
      window.dispatchEvent(
        new CustomEvent('performanceOptimizationsReady', {
          detail: { loadTime }
        })
      );
    } catch (error) {
      console.error('❌ Error inicializando optimizaciones de rendimiento:', error);
    }
  }

  /**
   * Configura recursos críticos para carga inicial
   */
  function setupCriticalResources() {
    const optimizer = window.InitialLoadOptimizer;

    // Recursos críticos (deben cargarse inmediatamente)
    optimizer.registerCriticalResource({
      type: 'script',
      url: '/assets/scripts/firebase-init.js',
      options: { type: 'module' }
    });

    optimizer.registerCriticalResource({
      type: 'script',
      url: '/assets/scripts/auth.js'
    });

    optimizer.registerCriticalResource({
      type: 'script',
      url: '/assets/scripts/error-handler.js'
    });

    // Recursos diferidos (pueden cargarse después del DOM)
    optimizer.registerDeferredResource({
      type: 'script',
      url: '/assets/scripts/firebase-repo-base.js'
    });

    optimizer.registerDeferredResource({
      type: 'script',
      url: '/assets/scripts/firebase-repos.js'
    });
  }

  /**
   * Helper para cargar scripts
   */
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      // Convertir ruta relativa a absoluta desde la raíz del sitio
      let absoluteSrc = src;
      if (src.startsWith('../')) {
        // Si es relativa, convertir a absoluta desde la raíz
        absoluteSrc = src.replace('../', '/');
      } else if (!src.startsWith('/') && !src.startsWith('http')) {
        // Si no tiene prefijo, asumir que es desde assets/scripts/performance/
        absoluteSrc = `/assets/scripts/performance/${src}`;
      }

      const script = document.createElement('script');
      script.src = absoluteSrc;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Error cargando ${absoluteSrc}`));
      document.head.appendChild(script);
    });
  }

  /**
   * Extiende FirebaseRepoBase con métodos optimizados
   */
  function extendFirebaseRepos() {
    if (!window.FirebaseRepoBase || !window.FirebaseQueryOptimizer) {
      return;
    }

    // Guardar referencia al método original
    const originalGetAll = window.FirebaseRepoBase.prototype.getAll;

    // Extender con método optimizado
    window.FirebaseRepoBase.prototype.getAllOptimized = async function (options = {}) {
      const { limit = 50, useCache = true, page = 1, pageSize = 50 } = options;

      // Si se solicita paginación, usar el optimizador
      if (page > 1 || limit) {
        try {
          return window.FirebaseQueryOptimizer.getAllPaginated(this, {
            pageSize: limit || pageSize,
            page,
            useCache,
            orderBy: 'fechaCreacion',
            orderDirection: 'desc'
          });
        } catch (error) {
          console.warn('⚠️ Error en consulta optimizada, usando método estándar:', error);
          return originalGetAll.call(this, { limit, useCache });
        }
      }

      // Para consultas sin límite, usar método original pero con caché
      return originalGetAll.call(this, { useCache });
    };
  }

  /**
   * Inicializa cuando el DOM esté listo
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initPerformanceOptimizations().then(() => {
        // Extender repositorios después de que todo esté cargado
        setTimeout(extendFirebaseRepos, 1000);
      });
    });
  } else {
    initPerformanceOptimizations().then(() => {
      setTimeout(extendFirebaseRepos, 1000);
    });
  }

  // Exponer API global
  window.PerformanceOptimizations = {
    config,
    init: initPerformanceOptimizations,
    extendRepos: extendFirebaseRepos,
    getStats: () => {
      const stats = {};
      if (window.FirebaseQueryOptimizer) {
        stats.queryCache = window.FirebaseQueryOptimizer.getCacheStats();
      }
      if (window.CodeSplitLoader) {
        stats.codeSplit = window.CodeSplitLoader.getStats();
      }
      if (window.InitialLoadOptimizer) {
        stats.initialLoad = window.InitialLoadOptimizer.getLoadStats();
      }
      return stats;
    }
  };

  console.log('✅ Performance Optimizations Module cargado');
})();
