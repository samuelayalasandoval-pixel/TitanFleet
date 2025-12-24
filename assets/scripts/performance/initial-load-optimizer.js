/**
 * Initial Load Optimizer
 * Optimiza el tiempo de carga inicial de la aplicación
 */

class InitialLoadOptimizer {
  constructor() {
    this.criticalResources = [];
    this.deferredResources = [];
    this.lazyResources = [];
    this.loadStartTime = performance.now();
  }

  /**
   * Registra recursos críticos que deben cargarse inmediatamente
   */
  registerCriticalResource(resource) {
    this.criticalResources.push(resource);
  }

  /**
   * Registra recursos que pueden cargarse después del contenido crítico
   */
  registerDeferredResource(resource) {
    this.deferredResources.push(resource);
  }

  /**
   * Registra recursos que pueden cargarse bajo demanda
   */
  registerLazyResource(resource) {
    this.lazyResources.push(resource);
  }

  /**
   * Precarga recursos críticos
   */
  async preloadCriticalResources() {
    const startTime = performance.now();

    const preloadPromises = this.criticalResources.map(resource => this._preloadResource(resource));

    await Promise.allSettled(preloadPromises);

    const loadTime = performance.now() - startTime;
    if (window.DEBUG_PERFORMANCE) {
      console.log(`✅ Recursos críticos precargados en ${loadTime.toFixed(2)}ms`);
    }
  }

  /**
   * Carga recursos diferidos después de que el contenido crítico esté listo
   */
  async loadDeferredResources() {
    // Esperar a que el DOM esté completamente cargado
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }

    // Esperar un frame adicional para no bloquear el renderizado
    await new Promise(resolve => requestAnimationFrame(resolve));

    const startTime = performance.now();

    const loadPromises = this.deferredResources.map(resource => this._loadResource(resource));

    await Promise.allSettled(loadPromises);

    const loadTime = performance.now() - startTime;
    if (window.DEBUG_PERFORMANCE) {
      console.log(`✅ Recursos diferidos cargados en ${loadTime.toFixed(2)}ms`);
    }
  }

  /**
   * Precarga un recurso específico
   */
  async _preloadResource(resource) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = resource.type === 'script' ? 'preload' : 'preload';
      link.as = resource.type === 'script' ? 'script' : 'style';
      link.href = resource.url;
      link.crossOrigin = resource.crossOrigin || 'anonymous';

      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Error precargando ${resource.url}`));

      document.head.appendChild(link);
    });
  }

  /**
   * Carga un recurso diferido
   */
  async _loadResource(resource) {
    if (resource.type === 'script') {
      return this._loadScript(resource.url, resource.options || {});
    } else if (resource.type === 'style') {
      return this._loadStyle(resource.url);
    }
  }

  /**
   * Carga un script de forma asíncrona
   */
  async _loadScript(src, options = {}) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = options.async !== false;
      script.defer = options.defer || false;

      if (options.type) {
        script.type = options.type;
      }

      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Error cargando script: ${src}`));

      document.head.appendChild(script);
    });
  }

  /**
   * Carga un estilo
   */
  async _loadStyle(href) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;

      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Error cargando estilo: ${href}`));

      document.head.appendChild(link);
    });
  }

  /**
   * Optimiza la carga inicial de la página
   */
  async optimizeInitialLoad() {
    // 1. Precargar recursos críticos
    await this.preloadCriticalResources();

    // 2. Cargar recursos diferidos después del DOM
    this.loadDeferredResources().catch(err => {
      console.warn('⚠️ Error cargando recursos diferidos:', err);
    });

    // 3. Registrar métricas de rendimiento
    this._registerPerformanceMetrics();
  }

  /**
   * Registra métricas de rendimiento
   */
  _registerPerformanceMetrics() {
    if ('PerformanceObserver' in window) {
      // Observar métricas de carga
      try {
        const observer = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const metrics = {
                domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                loadComplete: entry.loadEventEnd - entry.loadEventStart,
                totalTime: entry.loadEventEnd - entry.fetchStart
              };

              if (window.DEBUG_PERFORMANCE) {
                console.log('📊 Métricas de carga:', metrics);
              }

              // Guardar en window para acceso externo
              window.performanceMetrics = metrics;
            }
          }
        });

        observer.observe({ entryTypes: ['navigation'] });
      } catch (e) {
        console.warn('⚠️ PerformanceObserver no disponible:', e);
      }
    }
  }

  /**
   * Obtiene estadísticas de carga
   */
  getLoadStats() {
    const totalTime = performance.now() - this.loadStartTime;
    return {
      totalLoadTime: totalTime,
      criticalResources: this.criticalResources.length,
      deferredResources: this.deferredResources.length,
      lazyResources: this.lazyResources.length,
      metrics: window.performanceMetrics || null
    };
  }
}

// Crear instancia global
window.InitialLoadOptimizer = new InitialLoadOptimizer();

// Auto-optimizar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.InitialLoadOptimizer.optimizeInitialLoad();
  });
} else {
  window.InitialLoadOptimizer.optimizeInitialLoad();
}
