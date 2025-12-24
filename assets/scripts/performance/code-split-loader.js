/**
 * Code Split Loader - Sistema de carga dinámica de módulos
 * Optimiza el rendimiento cargando módulos solo cuando se necesitan
 */

class CodeSplitLoader {
  constructor() {
    this.loadedModules = new Set();
    this.loadingPromises = new Map();
    this.moduleCache = new Map();
  }

  /**
   * Carga un módulo dinámicamente
   * @param {string} modulePath - Ruta del módulo a cargar
   * @param {Object} options - Opciones de carga
   * @returns {Promise} - Promesa que se resuelve cuando el módulo está cargado
   */
  async loadModule(modulePath, options = {}) {
    const {
      priority = 'normal', // 'critical', 'high', 'normal', 'low'
      _preload = false,
      cache = true
    } = options;

    // Si ya está cargado, retornar inmediatamente
    if (this.loadedModules.has(modulePath)) {
      return Promise.resolve();
    }

    // Si ya está cargando, retornar la promesa existente
    if (this.loadingPromises.has(modulePath)) {
      return this.loadingPromises.get(modulePath);
    }

    // Si está en caché, retornar inmediatamente
    if (cache && this.moduleCache.has(modulePath)) {
      this.loadedModules.add(modulePath);
      return Promise.resolve();
    }

    // Crear nueva promesa de carga
    const loadPromise = this._loadModuleInternal(modulePath, priority);
    this.loadingPromises.set(modulePath, loadPromise);

    try {
      await loadPromise;
      this.loadedModules.add(modulePath);
      if (cache) {
        this.moduleCache.set(modulePath, true);
      }
    } catch (error) {
      console.error(`❌ Error cargando módulo ${modulePath}:`, error);
      throw error;
    } finally {
      this.loadingPromises.delete(modulePath);
    }
  }

  /**
   * Carga interna del módulo
   */
  async _loadModuleInternal(modulePath, priority) {
    const startTime = performance.now();

    try {
      // Preload hint para el navegador
      if (priority === 'critical' || priority === 'high') {
        const link = document.createElement('link');
        link.rel = 'modulepreload';
        link.href = modulePath;
        document.head.appendChild(link);
      }

      // Cargar el módulo dinámicamente
      await import(modulePath);

      const loadTime = performance.now() - startTime;
      if (window.DEBUG_PERFORMANCE) {
        console.log(`✅ Módulo cargado: ${modulePath} (${loadTime.toFixed(2)}ms)`);
      }
    } catch (error) {
      console.error(`❌ Error importando módulo ${modulePath}:`, error);
      throw error;
    }
  }

  /**
   * Precarga múltiples módulos en paralelo
   * @param {Array<string>} modulePaths - Array de rutas de módulos
   * @param {Object} options - Opciones de carga
   */
  async preloadModules(modulePaths, options = {}) {
    const { priority = 'low' } = options;
    const promises = modulePaths.map(path => this.loadModule(path, { priority, preload: true }));
    return Promise.allSettled(promises);
  }

  /**
   * Carga módulos críticos necesarios para el funcionamiento básico
   */
  async loadCriticalModules() {
    const criticalModules = [
      '/assets/scripts/firebase-init.js',
      '/assets/scripts/auth.js',
      '/assets/scripts/error-handler.js'
    ];

    return this.preloadModules(criticalModules, { priority: 'critical' });
  }

  /**
   * Carga módulos de una página específica
   * @param {string} pageName - Nombre de la página (ej: 'trafico', 'logistica')
   */
  async loadPageModules(pageName) {
    const moduleMap = {
      trafico: [
        '/assets/scripts/trafico/modules-config.js',
        '/assets/scripts/trafico/page-init.js',
        '/assets/scripts/trafico/form-handler.js'
      ],
      logistica: [
        '/assets/scripts/logistica/modules-config.js',
        '/assets/scripts/logistica/page-init.js',
        '/assets/scripts/logistica/form-handler.js'
      ],
      facturacion: [
        '/assets/scripts/facturacion/modules-config.js',
        '/assets/scripts/facturacion/page-init.js',
        '/assets/scripts/facturacion/form-handler.js'
      ],
      configuracion: [
        '/assets/scripts/configuracion-modules.js',
        '/assets/scripts/configuracion.js',
        '/assets/scripts/configuracion-firebase.js'
      ],
      reportes: ['/assets/scripts/reportes-components-integration.js'],
      diesel: [
        '/assets/scripts/diesel/modules-config.js',
        '/assets/scripts/diesel/diesel-page-init.js'
      ],
      mantenimiento: ['/assets/scripts/mantenimiento/mantenimiento-page-init.js'],
      tesoreria: ['/assets/scripts/tesoreria-modules.js', '/assets/scripts/tesoreria-init.js']
    };

    const modules = moduleMap[pageName] || [];
    if (modules.length === 0) {
      console.warn(`⚠️ No hay módulos definidos para la página: ${pageName}`);
      return;
    }

    return this.preloadModules(modules, { priority: 'high' });
  }

  /**
   * Limpia el caché de módulos
   */
  clearCache() {
    this.moduleCache.clear();
    this.loadedModules.clear();
  }

  /**
   * Obtiene estadísticas de carga
   */
  getStats() {
    return {
      loadedModules: this.loadedModules.size,
      cachedModules: this.moduleCache.size,
      loadingModules: this.loadingPromises.size
    };
  }
}

// Crear instancia global
window.CodeSplitLoader = new CodeSplitLoader();

// Auto-cargar módulos críticos cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.CodeSplitLoader.loadCriticalModules();
  });
} else {
  window.CodeSplitLoader.loadCriticalModules();
}
